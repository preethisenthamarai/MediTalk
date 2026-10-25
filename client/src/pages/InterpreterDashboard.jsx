import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { io } from 'socket.io-client';
import api, { errMsg, SOCKET_URL, tokens } from '../api/client';
import useLanguages from '../hooks/useLanguages';
import { fmtDate } from '../utils/languages';
import { useAuth } from '../context/AuthContext';

export default function InterpreterDashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const languages = useLanguages();
  const [data, setData] = useState({ pending: [], mine: [] });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [search, setSearch] = useState('');
  const [connected, setConnected] = useState(false);
  const langName = (c) => languages.find((l) => l.code === c)?.nativeName || c;

  const load = useCallback(async (quiet = false) => {
    try {
      const r = await api.get('/interpreters/pending');
      setData({ pending: Array.isArray(r.data.pending) ? r.data.pending : [], mine: Array.isArray(r.data.mine) ? r.data.mine : [] });
      setError('');
    } catch (e) { setError(errMsg(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const socket = io(SOCKET_URL, { auth: { token: tokens.access }, reconnection: true, reconnectionAttempts: Infinity });
    const refresh = () => load(true);
    socket.on('connect', () => { setConnected(true); refresh(); });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));
    ['interpreter-request', 'interpreter-request-taken', 'interpreter-request-updated'].forEach((event) => socket.on(event, refresh));
    const id = window.setInterval(refresh, 15000);
    return () => { window.clearInterval(id); socket.removeAllListeners(); socket.disconnect(); };
  }, [load]);

  const filteredPending = useMemo(() => data.pending.filter((r) =>
    (filterLanguage === 'all' || r.language === filterLanguage) &&
    (filterUrgency === 'all' || r.urgency === filterUrgency) &&
    `${r.roomId || ''} ${r.requestedBy?.name || ''} ${r.language || ''}`.toLowerCase().includes(search.toLowerCase())
  ), [data.pending, filterLanguage, filterUrgency, search]);

  const accept = async (id) => {
    if (accepting) return;
    setAccepting(id); setError(''); setNotice('');
    try {
      const { data: result } = await api.post(`/interpreters/${id}/accept`);
      setNotice('Request accepted. Opening the assigned consultation room…');
      await load(true);
      navigate(`/room/${result.roomId}`);
    } catch (e) { setError(errMsg(e)); await load(true); }
    finally { setAccepting(''); }
  };

  const complete = async (id) => {
    try { await api.post(`/interpreters/${id}/complete`); setNotice('Consultation marked completed.'); await load(true); }
    catch (e) { setError(errMsg(e)); }
  };

  return (
    <div className="page interpreter-page">
      <div className="page-head">
        <div>
          <p className="muted small-text">TELEMED · INTERPRETER SERVICES</p>
          <h1>Interpreter Desk</h1>
          <p className="muted">Review incoming language requests and join assigned consultations securely.</p>
        </div>
        <div className="row gap wrap">
          <span className={`pill ${connected ? 'in-progress' : 'cancelled'}`}>{connected ? '● Live updates connected' : '○ Reconnecting / polling'}</span>
          <button className="btn ghost" onClick={() => load()} disabled={loading}>↻ Refresh</button>
          <button className="btn ghost" onClick={() => { if (typeof logout === 'function') logout(); else navigate('/'); }}>Log out</button>
        </div>
      </div>
      <section className="interp-welcome card">
        <div className="interp-avatar">{(user?.name || 'I').slice(0, 1).toUpperCase()}</div>
        <div className="grow"><h2>Welcome, {user?.name || 'Interpreter'}</h2><p className="muted">{user?.specialty || 'Medical interpreter'} · Languages: {(user?.spokenLanguages || []).map(langName).join(', ') || 'No spoken languages configured'}</p></div>
        <span className="pill in-progress">Staff account</span>
      </section>
      {error && <p className="error notice">{error}</p>}
      {notice && <p className="notice ok">{notice}</p>}

      <div className="stats interp-stats">
        <div className="card stat"><div className="stat-icon">◷</div><div><div className="stat-n">{data.pending.length}</div><small>Pending requests</small></div></div>
        <div className="card stat"><div className="stat-icon">⚠</div><div><div className="stat-n">{data.pending.filter((r) => r.urgency === 'high').length}</div><small>High priority</small></div></div>
        <div className="card stat"><div className="stat-icon">✓</div><div><div className="stat-n">{data.mine.length}</div><small>Assigned to me</small></div></div>
        <div className="card stat"><div className="stat-icon">◎</div><div><div className="stat-n">{data.mine.filter((r) => r.status === 'in_progress').length}</div><small>In consultation</small></div></div>
      </div>

      <section>
        <div className="page-head interp-section-head"><div><h2>Incoming requests</h2><p className="muted">High-priority requests are shown first.</p></div><span className="pill">{filteredPending.length} shown</span></div>
        <div className="interp-filters card">
          <label>Search<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Room, requester or language" /></label>
          <label>Language<select value={filterLanguage} onChange={(e) => setFilterLanguage(e.target.value)}><option value="all">All languages</option>{languages.map((l) => <option key={l.code} value={l.code}>{l.nativeName}</option>)}</select></label>
          <label>Urgency<select value={filterUrgency} onChange={(e) => setFilterUrgency(e.target.value)}><option value="all">All priorities</option><option value="high">High priority</option><option value="normal">Normal</option></select></label>
        </div>
        {loading ? <div className="card empty"><p>Loading interpreter requests…</p></div> : filteredPending.length === 0 ? <div className="card empty"><div className="interp-empty-icon">✓</div><h3>You're all caught up</h3><p className="muted">No pending requests match your languages and filters. New requests will appear here automatically.</p><button className="btn ghost" onClick={() => { setSearch(''); setFilterLanguage('all'); setFilterUrgency('all'); load(); }}>Clear filters and refresh</button></div> :
          <div className="grid interp-request-grid">{filteredPending.map((r) => <article key={r._id} className={`card interp-request ${r.urgency === 'high' ? 'priority-high' : ''}`}>
            <div className="row between gap"><span className="interp-language">{langName(r.language)}</span><span className={`pill ${r.urgency === 'high' ? 'cancelled' : 'scheduled'}`}>{r.urgency === 'high' ? '⚠ High priority' : 'Normal priority'}</span></div>
            <div className="interp-request-meta"><span>Requested by {r.requestedBy?.name || 'Care team'}</span><span>{fmtDate(r.createdAt, i18n.language)}</span></div>
            <div className="interp-room-id">Room · {String(r.roomId || '').slice(0, 14)}</div>
            {r.reason && <p className="muted interp-reason">{r.reason}</p>}
            <button className="btn interp-accept" disabled={!!accepting} onClick={() => accept(r._id)}>{accepting === r._id ? 'Accepting…' : 'Accept request →'}</button>
          </article>)}</div>}
      </section>

      <section>
        <div className="page-head interp-section-head"><div><h2>My assigned consultations</h2><p className="muted">Only requests assigned to your account appear here.</p></div></div>
        {data.mine.length === 0 ? <div className="card interp-assigned-empty"><p className="muted">You have no assigned consultations yet.</p></div> : <div className="grid">{data.mine.map((r) => <article key={r._id} className="card interp-assigned">
          <div className="row between gap"><b>{langName(r.language)}</b><span className={`pill ${r.status === 'in_progress' ? 'in-progress' : 'scheduled'}`}>{r.status === 'in_progress' ? 'In consultation' : 'Accepted'}</span></div>
          <p className="muted">{r.requestedBy?.name || 'Care team'} · Accepted {r.acceptedAt ? fmtDate(r.acceptedAt, i18n.language) : fmtDate(r.createdAt, i18n.language)}</p>
          <div className="row gap wrap"><Link className="btn" to={`/room/${r.roomId}`}>Open consultation room →</Link><button className="btn ghost" onClick={() => complete(r._id)}>Mark completed</button></div>
        </article>)}</div>}
      </section>
    </div>
  );
}
