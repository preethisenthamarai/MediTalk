import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import useLanguages from '../hooks/useLanguages';
import api, { errMsg } from '../api/client';
import { toLocalInput } from '../utils/languages';
import MedicalIcon from '../components/MedicalIcon';

export default function BookAppointment() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const languages = useLanguages();
  const navigate = useNavigate();
  const [clinicians, setClinicians] = useState([]);
  const [form, setForm] = useState({ clinicianId: '', scheduledAt: toLocalInput(new Date(Date.now() + 3600_000)), reason: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get('/users/clinicians').then((r) => setClinicians(r.data.clinicians)).catch((e) => setError(errMsg(e))); }, []);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const myLang = languages.find((l) => l.code === user.preferredLanguage)?.nativeName || user.preferredLanguage;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await api.post('/appointments', { ...form, scheduledAt: new Date(form.scheduledAt).toISOString() });
      navigate('/dashboard');
    } catch (err) { setError(errMsg(err, t('common.error'))); } finally { setBusy(false); }
  };

  return (
    <div className="page narrow">
      <form className="card stack" onSubmit={submit}>
        <h1>{t('book.title')}</h1>
        <p className="notice"><MedicalIcon name="language" /> {t('book.interpretNote', { lang: myLang })}</p>
        <label>{t('book.clinician')}
          <select required value={form.clinicianId} onChange={set('clinicianId')}>
            <option value="">{t('book.choose')}</option>
            {clinicians.map((c) => <option key={c._id} value={c._id}>{c.name}{c.specialty ? ` · ${c.specialty}` : ''}</option>)}
          </select>
        </label>
        <label>{t('book.date')}<input type="datetime-local" required value={form.scheduledAt} min={toLocalInput(new Date())} onChange={set('scheduledAt')} /></label>
        <label>{t('book.reason')}<textarea rows={3} maxLength={1000} value={form.reason} onChange={set('reason')} /></label>
        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={busy}>{busy ? t('common.loading') : t('book.submit')}</button>
      </form>
    </div>
  );
}
