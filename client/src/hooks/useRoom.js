import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL, tokens } from '../api/client';

const iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
if (import.meta.env.VITE_TURN_URL) {
  iceServers.push({ urls: import.meta.env.VITE_TURN_URL, username: import.meta.env.VITE_TURN_USERNAME, credential: import.meta.env.VITE_TURN_CREDENTIAL });
}

/**
 * Everything about being in a call: media, WebRTC mesh (patient + clinician + optional interpreter),
 * Socket.IO signalling and live translated captions.
 */
export default function useRoom({ roomId, language }) {
  const socketRef = useRef(null);
  const localRef = useRef(null);
  const pcs = useRef({});
  const pendingIce = useRef({});
  const langRef = useRef(language);
  langRef.current = language;

  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState({}); // socketId -> { info, stream }
  const [captions, setCaptions] = useState([]);
  const [status, setStatus] = useState('connecting'); // connecting | joined | denied | ended | error
  const [mediaError, setMediaError] = useState(false);
  const [interpreterNotice, setInterpreterNotice] = useState(null);

  const updatePeer = (id, patch) => setPeers((p) => ({ ...p, [id]: { ...(p[id] || {}), ...patch } }));

  const createPc = useCallback((peerId) => {
    if (pcs.current[peerId]) return pcs.current[peerId];
    const pc = new RTCPeerConnection({ iceServers });
    pcs.current[peerId] = pc;
    localRef.current?.getTracks().forEach((t) => pc.addTrack(t, localRef.current));
    pc.onicecandidate = (e) => { if (e.candidate) socketRef.current?.emit('signal', { to: peerId, data: { candidate: e.candidate } }); };
    pc.ontrack = (e) => updatePeer(peerId, { stream: e.streams[0] });
    return pc;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const socket = io(SOCKET_URL, { auth: { token: tokens.access }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    const closePeer = (id) => {
      pcs.current[id]?.close();
      delete pcs.current[id];
      setPeers((p) => { const n = { ...p }; delete n[id]; return n; });
    };

    async function start() {
      // 1. camera + mic (fall back to audio-only, then to no media)
      let stream = null;
      try { stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); }
      catch {
        try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { setMediaError(true); }
      }
      if (cancelled) { stream?.getTracks().forEach((t) => t.stop()); return; }
      localRef.current = stream;
      setLocalStream(stream);

      // 2. join the room
      const join = () => socket.emit('join-room', { roomId, language: langRef.current }, async (res) => {
        if (!res?.ok) { setStatus(res?.error === 'NO_ACCESS' ? 'denied' : 'error'); return; }
        setStatus('joined');
        // The newcomer creates the offers, existing peers answer (avoids offer collisions)
        for (const info of res.peers) {
          updatePeer(info.socketId, { info });
          const pc = createPc(info.socketId);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('signal', { to: info.socketId, data: { sdp: pc.localDescription } });
        }
      });
      if (socket.connected) join(); else socket.once('connect', join);
    }

    socket.on('connect_error', () => setStatus((s) => (s === 'joined' ? s : 'error')));
    socket.on('peer-joined', (info) => updatePeer(info.socketId, { info }));
    socket.on('peer-updated', (info) => updatePeer(info.socketId, { info }));
    socket.on('peer-left', ({ socketId }) => closePeer(socketId));

    socket.on('signal', async ({ from, data }) => {
      const pc = createPc(from);
      try {
        if (data.sdp) {
          await pc.setRemoteDescription(data.sdp);
          (pendingIce.current[from] || []).forEach((c) => pc.addIceCandidate(c).catch(() => {}));
          pendingIce.current[from] = [];
          if (data.sdp.type === 'offer') {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('signal', { to: from, data: { sdp: pc.localDescription } });
          }
        } else if (data.candidate) {
          if (pc.remoteDescription) await pc.addIceCandidate(data.candidate);
          else (pendingIce.current[from] = pendingIce.current[from] || []).push(data.candidate);
        }
      } catch (e) { console.warn('signal error', e); }
    });

    socket.on('caption', (c) => setCaptions((prev) => [...prev.slice(-199), c]));
    socket.on('interpreter-accepted', (d) => setInterpreterNotice(d));
    socket.on('room-ended', () => setStatus('ended'));

    start();

    return () => {
      cancelled = true;
      Object.values(pcs.current).forEach((pc) => pc.close());
      pcs.current = {};
      localRef.current?.getTracks().forEach((t) => t.stop());
      socket.disconnect();
    };
  }, [roomId, createPc]);

  // Tell the room when this user switches language mid-call
  useEffect(() => { socketRef.current?.emit('set-language', { language }); }, [language]);

  const sendCaption = useCallback((text) => socketRef.current?.emit('caption', { text }), []);
  const setEnabled = useCallback((kind, enabled) => {
    localRef.current?.getTracks().filter((t) => t.kind === kind).forEach((t) => { t.enabled = enabled; });
  }, []);

  return { localStream, peers, captions, status, mediaError, interpreterNotice, sendCaption, setEnabled };
}
