import { randomUUID } from 'crypto';
import Consultation from '../models/Consultation.js';
import Appointment from '../models/Appointment.js';
import Translation from '../models/Translation.js';
import { userFromToken } from '../middleware/auth.js';
import { getRoomAccess } from '../services/roomAccess.js';
import { translateText } from '../services/translationService.js';

const peerInfo = (s) => ({
  socketId: s.id,
  userId: String(s.data.user._id),
  name: s.data.user.name,
  role: s.data.user.role,
  language: s.data.lang,
});

export function registerSockets(io) {
  // JWT authentication for every socket connection
  io.use(async (socket, next) => {
    try {
      socket.data.user = await userFromToken(socket.handshake.auth?.token || '');
      next();
    } catch (err) {
      next(new Error(err.code || 'AUTH_FAILED'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    socket.join(`user:${user._id}`); // personal channel for notifications
    if (user.role === 'interpreter') socket.join('interpreters');

    // ---- join a video room ----
    socket.on('join-room', async ({ roomId, language } = {}, ack = () => {}) => {
      try {
        const access = await getRoomAccess(user, String(roomId || ''));
        if (!access) return ack({ ok: false, error: 'NO_ACCESS' });
        if (user.role === 'interpreter') {
          const InterpreterRequest = (await import('../models/InterpreterRequest.js')).default;
          await InterpreterRequest.updateOne({ roomId: String(roomId), interpreter: user._id, status: 'accepted' }, { $set: { status: 'in_progress', startedAt: new Date() } });
        }

        socket.data.roomId = roomId;
        socket.data.lang = String(language || user.preferredLanguage || 'en').slice(0, 10);

        const existing = await io.in(roomId).fetchSockets();
        const consultation = await Consultation.findOneAndUpdate(
          { roomId },
          { $setOnInsert: { appointment: access.appointment._id, startedAt: new Date() }, $push: { participants: { user: user._id, role: user.role } } },
          { upsert: true, new: true }
        );
        socket.data.consultationId = consultation._id;
        if (access.appointment.status === 'scheduled') {
          await Appointment.updateOne({ _id: access.appointment._id }, { status: 'in-progress' });
        }

        socket.join(roomId);
        socket.to(roomId).emit('peer-joined', peerInfo(socket));
        ack({ ok: true, selfId: socket.id, peers: existing.map(peerInfo) });
      } catch (err) {
        console.error('join-room', err);
        ack({ ok: false, error: 'SERVER_ERROR' });
      }
    });

    // ---- the user changed the language they speak/read in the call ----
    socket.on('set-language', ({ language } = {}) => {
      if (!socket.data.roomId) return;
      socket.data.lang = String(language || 'en').slice(0, 10);
      socket.to(socket.data.roomId).emit('peer-updated', peerInfo(socket));
    });

    // ---- WebRTC signalling relay (offer / answer / ICE) ----
    socket.on('signal', async ({ to, data } = {}) => {
      try {
        const roomId = socket.data.roomId;
        if (!roomId || !to) return;
        const target = (await io.in(roomId).fetchSockets()).find((s) => s.id === to);
        if (target) target.emit('signal', { from: socket.id, data });
      } catch (err) {
        console.error('signal', err.message);
      }
    });

    // ---- live captions: speech text in -> translated per listener language ----
    socket.on('caption', async ({ text } = {}, ack = () => {}) => {
      try {
        const roomId = socket.data.roomId;
        if (!roomId) return ack({ ok: false });
        const original = String(text || '').trim().slice(0, 1000);
        if (!original) return ack({ ok: false });

        const started = Date.now();
        const sourceLang = socket.data.lang;
        const sockets = await io.in(roomId).fetchSockets();
        const others = sockets.filter((s) => s.id !== socket.id);
        const targetLangs = [...new Set(others.map((s) => s.data.lang).filter((l) => l !== sourceLang))];

        const results = {};
        await Promise.all(targetLangs.map(async (lang) => { results[lang] = await translateText(original, sourceLang, lang); }));

        const captionId = randomUUID();
        const base = { id: captionId, at: Date.now(), from: peerInfo(socket), sourceLang, original };

        // Speaker sees own words; each listener gets their own language
        socket.emit('caption', { ...base, own: true, targetLang: sourceLang, translated: original });
        for (const s of others) {
          const r = results[s.data.lang];
          s.emit('caption', {
            ...base,
            targetLang: s.data.lang,
            translated: r ? r.text : original,
            glossaryHits: r?.glossaryHits || [],
            highRisk: !!r?.highRisk,
            fallback: !!r?.fallback,
            latencyMs: Date.now() - started,
          });
        }
        ack({ ok: true, latencyMs: Date.now() - started });

        // Persist transcript (fire and forget; never block the live call)
        const common = { consultation: socket.data.consultationId, captionId, speaker: user._id, speakerName: user.name, speakerRole: user.role, sourceLang, sourceText: original };
        const rows = [{ ...common, targetLang: sourceLang, translatedText: original, provider: 'none' }];
        for (const [lang, r] of Object.entries(results)) {
          rows.push({ ...common, targetLang: lang, translatedText: r.text, glossaryHits: r.glossaryHits, provider: r.provider, latencyMs: r.latencyMs, fallback: r.fallback });
        }
        Translation.insertMany(rows).catch((e) => console.error('transcript save failed', e.message));
      } catch (err) {
        console.error('caption', err.message);
        ack({ ok: false, error: 'SERVER_ERROR' });
      }
    });

    socket.on('disconnect', async () => {
      try {
        const roomId = socket.data.roomId;
        if (!roomId) return;
        socket.to(roomId).emit('peer-left', { socketId: socket.id });
        const remaining = await io.in(roomId).fetchSockets();
        if (remaining.length === 0) {
          await Consultation.updateOne({ roomId }, { endedAt: new Date() });
        }
      } catch (err) {
        console.error('disconnect', err.message);
      }
    });
  });
}
