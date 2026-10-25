import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api, { errMsg } from '../api/client';

const ROLES = ['patient', 'clinician', 'interpreter', 'admin'];

export default function AdminPanel() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('users');
  const [error, setError] = useState('');
  const run = async (fn) => { setError(''); try { await fn(); } catch (e) { setError(errMsg(e)); } };

  return (
    <div className="page">
      <h1>{t('admin.title')}</h1>
      <div className="tabs">{['users', 'glossary', 'languages'].map((k) => <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{t(`admin.${k}`)}</button>)}</div>
      {error && <p className="error">{error}</p>}
      {tab === 'users' && <Users run={run} />}
      {tab === 'glossary' && <GlossaryTab run={run} />}
      {tab === 'languages' && <LanguagesTab run={run} />}
    </div>
  );
}

function Users({ run }) {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const empty = { name: '', email: '', password: '', role: 'clinician', preferredLanguage: 'en', spokenLanguages: 'en', specialty: '' };
  const [form, setForm] = useState(empty);
  const load = useCallback(() => run(async () => setUsers((await api.get('/admin/users')).data.users)), [run]);
  useEffect(() => { load(); }, [load]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const create = (e) => { e.preventDefault(); run(async () => {
    await api.post('/admin/users', { ...form, spokenLanguages: form.spokenLanguages.split(',').map((s) => s.trim()).filter(Boolean) });
    setForm(empty); load();
  }); };
  const toggle = (u) => run(async () => { await api.patch(`/admin/users/${u._id}`, { active: !u.active }); load(); });
  const approve = (u) => run(async () => { await api.patch(`/admin/users/${u._id}`, { approved: u.approved === false }); load(); });

  return (
    <>
      <form className="card form-grid" onSubmit={create}>
        <input placeholder="Name" required value={form.name} onChange={set('name')} />
        <input placeholder="Email" type="email" required value={form.email} onChange={set('email')} />
        <input placeholder="Password (8+)" type="password" minLength={8} required value={form.password} onChange={set('password')} />
        <select value={form.role} onChange={set('role')}>{ROLES.map((r) => <option key={r} value={r}>{t(`roles.${r}`)}</option>)}</select>
        <input placeholder="Preferred lang (en)" value={form.preferredLanguage} onChange={set('preferredLanguage')} />
        <input placeholder="Spoken langs (en,ta)" value={form.spokenLanguages} onChange={set('spokenLanguages')} />
        <input placeholder="Specialty" value={form.specialty} onChange={set('specialty')} />
        <button className="btn">{t('admin.create')}</button>
      </form>
      <div className="table-wrap"><table>
        <thead><tr><th>Name</th><th>Email</th><th>{t('admin.role')}</th><th>Lang</th><th>{t('admin.active')}</th><th>{t('doctor.approved')}</th></tr></thead>
        <tbody>{users.map((u) => (
          <tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td>{t(`roles.${u.role}`)}</td><td>{u.preferredLanguage}{u.spokenLanguages?.length ? ` (${u.spokenLanguages.join(',')})` : ''}</td>
            <td><input type="checkbox" checked={u.active} onChange={() => toggle(u)} /></td>
            <td>{u.role === 'clinician' ? <input type="checkbox" checked={u.approved !== false} onChange={() => approve(u)} /> : '—'}</td></tr>
        ))}</tbody>
      </table></div>
    </>
  );
}

function GlossaryTab({ run }) {
  const { t } = useTranslation();
  const [langs, setLangs] = useState([]);
  const [entries, setEntries] = useState([]);
  const [term, setTerm] = useState('');
  const [tr, setTr] = useState({});
  const [highRisk, setHighRisk] = useState(false);
  const load = useCallback(() => run(async () => {
    setEntries((await api.get('/admin/glossary')).data.glossary);
    setLangs((await api.get('/admin/languages')).data.languages.filter((l) => l.code !== 'en'));
  }), [run]);
  useEffect(() => { load(); }, [load]);

  const add = (e) => { e.preventDefault(); run(async () => { await api.post('/admin/glossary', { term, sourceLang: 'en', translations: tr, highRisk }); setTerm(''); setTr({}); setHighRisk(false); load(); }); };
  const patch = (en, body) => run(async () => { await api.patch(`/admin/glossary/${en._id}`, body); load(); });
  const del = (en) => run(async () => { await api.delete(`/admin/glossary/${en._id}`); load(); });

  return (
    <>
      <p className="notice warn">⚠ {t('admin.unverifiedWarning')}</p>
      <form className="card form-grid" onSubmit={add}>
        <input placeholder={t('admin.term')} required value={term} onChange={(e) => setTerm(e.target.value)} />
        {langs.map((l) => <input key={l.code} placeholder={`${l.name} (${l.code})`} value={tr[l.code] || ''} onChange={(e) => setTr({ ...tr, [l.code]: e.target.value })} />)}
        <label className="check"><input type="checkbox" checked={highRisk} onChange={(e) => setHighRisk(e.target.checked)} /> {t('admin.highRisk')}</label>
        <button className="btn">{t('admin.add')}</button>
      </form>
      <div className="table-wrap"><table>
        <thead><tr><th>EN</th>{langs.map((l) => <th key={l.code}>{l.code}</th>)}<th>{t('admin.highRisk')}</th><th>{t('admin.verified')}</th><th /></tr></thead>
        <tbody>{entries.map((en) => (
          <tr key={en._id}><td><b>{en.term}</b></td>
            {langs.map((l) => <td key={l.code}>{en.translations?.[l.code] || '—'}</td>)}
            <td><input type="checkbox" checked={en.highRisk} onChange={(e) => patch(en, { highRisk: e.target.checked })} /></td>
            <td><input type="checkbox" checked={en.verified} onChange={(e) => patch(en, { verified: e.target.checked })} /></td>
            <td><button className="link" onClick={() => del(en)}>{t('common.delete')}</button></td></tr>
        ))}</tbody>
      </table></div>
    </>
  );
}

function LanguagesTab({ run }) {
  const { t } = useTranslation();
  const [langs, setLangs] = useState([]);
  const [form, setForm] = useState({ code: '', name: '', nativeName: '', speechCode: '' });
  const load = useCallback(() => run(async () => setLangs((await api.get('/admin/languages')).data.languages)), [run]);
  useEffect(() => { load(); }, [load]);
  const add = (e) => { e.preventDefault(); run(async () => { await api.post('/admin/languages', form); setForm({ code: '', name: '', nativeName: '', speechCode: '' }); load(); }); };
  const toggle = (l) => run(async () => { await api.patch(`/admin/languages/${l._id}`, { enabled: !l.enabled }); load(); });

  return (
    <>
      <p className="notice">UI translations only exist for en, ta, hi, es, fr, ar (client/src/i18n/locales). Other languages you add here work for live call translation, but the interface will show English until you add a locale file.</p>
      <form className="card form-grid" onSubmit={add}>
        {['code', 'name', 'nativeName', 'speechCode'].map((k) => <input key={k} placeholder={k} required value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />)}
        <button className="btn">{t('admin.add')}</button>
      </form>
      <div className="table-wrap"><table>
        <thead><tr><th>Code</th><th>Name</th><th>Native</th><th>Speech</th><th>{t('admin.enabled')}</th></tr></thead>
        <tbody>{langs.map((l) => <tr key={l._id}><td>{l.code}</td><td>{l.name}</td><td>{l.nativeName}</td><td>{l.speechCode}</td><td><input type="checkbox" checked={l.enabled} onChange={() => toggle(l)} /></td></tr>)}</tbody>
      </table></div>
    </>
  );
}
