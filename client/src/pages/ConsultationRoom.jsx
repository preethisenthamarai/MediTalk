import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import useRoom from '../hooks/useRoom';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import useLanguages from '../hooks/useLanguages';
import VideoTile from '../components/VideoTile';
import Captions from '../components/Captions';
import api, { errMsg } from '../api/client';
import MedicalIcon from '../components/MedicalIcon';

export default function ConsultationRoom() {
  const { roomId } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const languages = useLanguages();
  // Language spoken/read in THIS call. Starts from the profile language but is independent of the UI language.
  const [spokenLang, setSpokenLang] = useState(user.preferredLanguage);
  const myLang = spokenLang;
  const speechCode = languages.find((l) => l.code === myLang)?.speechCode || myLang;

  const { localStream, peers, captions, status, mediaError, interpreterNotice, sendCaption, setEnabled } = useRoom({ roomId, language: myLang });
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [translateOn, setTranslateOn] = useState(true);
  const [readAloud, setReadAloud] = useState(false);
  const [interim, setInterim] = useState('');
  const [typed, setTyped] = useState('');
  const [reqState, setReqState] = useState('idle'); // idle | sending | requested
  const [error, setError] = useState('');
  const spoken = useRef(null);

  // "Preview": show my own words translated into another language (handy when testing alone)
  const [previewLang, setPreviewLang] = useState('');
  const [previews, setPreviews] = useState({});
  const asked = useRef(new Set());

  const { supported, error: sttError } = useSpeechRecognition({
    lang: speechCode,
    active: translateOn && micOn && status === 'joined',
    onFinal: sendCaption,
    onInterim: setInterim,
  });

  // Has an interpreter already been requested for this room?
  useEffect(() => {
    api.get(`/interpreters/room/${roomId}`).then((r) => { if (r.data.requests.some((x) => ['pending', 'accepted'].includes(x.status))) setReqState('requested'); }).catch(() => {});
  }, [roomId]);

  useEffect(() => {
    if (!previewLang) return;
    captions.forEach((c) => {
      const key = `${c.id}:${previewLang}`;
      if (!c.own || c.sourceLang === previewLang || asked.current.has(key)) return;
      asked.current.add(key);
      api.post('/translate', { text: c.original, sourceLang: c.sourceLang, targetLang: previewLang })
        .then((r) => setPreviews((prev) => ({ ...prev, [key]: r.data.translated })))
        .catch(() => {});
    });
  }, [captions, previewLang]);

  // Optional: read incoming translations aloud
  useEffect(() => {
    const last = captions[captions.length - 1];
    if (!readAloud || !last || last.own || spoken.current === last.id || !('speechSynthesis' in window)) return;
    spoken.current = last.id;
    const u = new SpeechSynthesisUtterance(last.translated);
    u.lang = speechCode;
    window.speechSynthesis.speak(u);
  }, [captions, readAloud, speechCode]);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const peerList = useMemo(() => Object.entries(peers), [peers]);
  const langName = (c) => languages.find((l) => l.code === c)?.nativeName || c;
  const peerInfos = peerList.map(([, p]) => p.info).filter(Boolean);

  const toggleMic = () => { setEnabled('audio', !micOn); setMicOn(!micOn); };
  const toggleCam = () => { setEnabled('video', !camOn); setCamOn(!camOn); };

  const requestInterpreter = async () => {
    setReqState('sending'); setError('');
    // The interpreter must speak the patient's language
    const patientPeer = peerList.find(([, p]) => p.info?.role === 'patient');
    const language = user.role === 'patient' ? myLang : patientPeer?.[1].info.language || peerList[0]?.[1].info?.language || myLang;
    try {
      await api.post('/interpreters/request', { roomId, language, urgency: captions.some((c) => c.highRisk) ? 'high' : 'normal', reason: 'Requested from video call' });
      setReqState('requested');
    } catch (e) { setError(errMsg(e)); setReqState('idle'); }
  };

  const sendTyped = (e) => { e.preventDefault(); if (typed.trim()) { sendCaption(typed.trim()); setTyped(''); } };

  if (status === 'denied') return <div className="page narrow card"><p className="error">{t('room.noAccess')}</p><button className="btn" onClick={() => navigate('/dashboard')}>{t('nav.dashboard')}</button></div>;
  if (status === 'ended') return <div className="page narrow card"><p>{t('room.ended')}</p><button className="btn" onClick={() => navigate('/dashboard')}>{t('nav.dashboard')}</button></div>;

  const highRiskSeen = captions.some((c) => c.highRisk && !c.own);

  return (
    <div className="room">
      <section className="stage">
        {status === 'connecting' && <p className="notice">{t('room.connecting')}</p>}
        {status === 'error' && <p className="error">{t('common.error')}</p>}
        {status === 'joined' && peerList.length === 0 && <p className="notice">{t('room.waiting')}</p>}
        {mediaError && <p className="notice">{t('room.noMedia')}</p>}
        {interpreterNotice && <p className="notice ok"><MedicalIcon name="users" /> {t('room.interpreterJoined', { name: interpreterNotice.name })}</p>}
        {highRiskSeen && reqState === 'idle' && <p className="notice warn">⚠ {t('room.highRisk')}</p>}

        {peerInfos.length > 0 && (
          <div className="lang-bar">
            <span className="chip">{t('room.you')}: {langName(myLang)}</span>
            {peerInfos.map((p) => <span key={p.socketId} className="chip">{p.name}: {langName(p.language)}</span>)}
            <span className={`lang-status ${peerInfos.some((p) => p.language !== myLang) ? 'on' : ''}`}>
              {peerInfos.some((p) => p.language !== myLang) ? <><MedicalIcon name="refresh" /> {t('room.liveTranslation')}</> : t('room.sameLanguage')}
            </span>
          </div>
        )}

        <div className={`tiles n${Math.min(peerList.length + 1, 4)}`}>
          {peerList.map(([id, p]) => <VideoTile key={id} stream={p.stream} label={p.info?.name || '…'} sub={p.info ? t(`roles.${p.info.role}`) : ''} />)}
          <VideoTile stream={localStream} label={t('room.you')} muted sub={t(`roles.${user.role}`)} />
        </div>

        <div className="controls">
          <label className="lang-select" title={t('room.yourLanguage')}>
            <span><MedicalIcon name="language" /> {t('room.yourLanguage')}</span>
            <select value={spokenLang} onChange={(e) => setSpokenLang(e.target.value)}>
              {languages.map((l) => <option key={l.code} value={l.code}>{l.nativeName}</option>)}
            </select>
          </label>
          <button className={`btn round ${micOn ? '' : 'off'}`} onClick={toggleMic} title={t('room.mic')} aria-label={t('room.mic')}><MedicalIcon name={micOn ? 'mic' : 'micOff'} /></button>
          <button className={`btn round ${camOn ? '' : 'off'}`} onClick={toggleCam} title={t('room.camera')} aria-label={t('room.camera')}><MedicalIcon name={camOn ? 'camera' : 'cameraOff'} /></button>
          <button className={`btn ${translateOn ? '' : 'ghost'}`} onClick={() => setTranslateOn(!translateOn)}><MedicalIcon name="language" /> {translateOn ? t('room.captionsOn') : t('room.captionsOff')}</button>
          <button className={`btn ${readAloud ? '' : 'ghost'}`} onClick={() => setReadAloud(!readAloud)}><MedicalIcon name="volume" /> {t('room.readAloud')}</button>
          {user.role !== 'interpreter' && (
            <button className="btn ghost" disabled={reqState !== 'idle'} onClick={requestInterpreter}>
              <MedicalIcon name="users" /> {reqState === 'requested' ? t('room.interpreterRequested') : t('room.interpreter')}
            </button>
          )}
          {user.role === 'clinician' && <button className="btn danger" onClick={() => navigate(`/dashboard?end=${roomId}`)}>{t('room.endVisit')}</button>}
          <button className="btn danger ghost" onClick={() => navigate('/dashboard')}>{t('room.leave')}</button>
        </div>
        {error && <p className="error">{error}</p>}
        <small className="muted">{t('room.headphones')}</small>
      </section>

      <aside className="side card">
        <h2>{t('room.liveCaptions')}</h2>
        <label className="lang-select preview-select">
          <span><MedicalIcon name="refresh" /> {t('room.preview')}</span>
          <select value={previewLang} onChange={(e) => setPreviewLang(e.target.value)}>
            <option value="">{t('room.previewOff')}</option>
            {languages.filter((l) => l.code !== myLang).map((l) => <option key={l.code} value={l.code}>{l.nativeName}</option>)}
          </select>
        </label>
        {!supported && <p className="notice">{t('room.noSpeech')}</p>}
        {sttError && <p className="error"><MedicalIcon name="mic" /> {sttError}</p>}
        <Captions captions={captions} interim={interim} selfName={t('room.you')} previews={previews} previewLang={previewLang} langName={langName} />
        <form className="row gap" onSubmit={sendTyped}>
          <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={t('room.typeMessage')} maxLength={500} />
          <button className="btn small">{t('room.send')}</button>
        </form>
      </aside>
    </div>
  );
}
