import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useLanguages from '../hooks/useLanguages';
import { UI_LANGS } from '../i18n';
import api, { errMsg } from '../api/client';
import MedicalIcon from '../components/MedicalIcon';

export default function DoctorRegister() {
  const { t, i18n } = useTranslation();
  const languages = useLanguages().filter((l) => UI_LANGS.includes(l.code));
  const lang0 = (i18n.resolvedLanguage || 'en').split('-')[0];
  const [form, setForm] = useState({ name: '', email: '', password: '', specialty: '', licenseNumber: '', preferredLanguage: lang0, spoken: lang0 });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const { spoken, ...rest } = form;
      await api.post('/auth/register-doctor', { ...rest, spokenLanguages: spoken.split(',').map((s) => s.trim()).filter(Boolean) });
      setDone(true);
    } catch (err) { setError(errMsg(err, t('common.error'))); } finally { setBusy(false); }
  };

  if (done) return (
    <div className="auth-wrap"><div className="card auth"><div className="auth-icon"><MedicalIcon name="check" size={28} /></div><p>{t('portal.submitted')}</p><Link className="btn" to="/doctor/login">{t('portal.doctorLogin')}</Link></div></div>
  );

  return (
    <div className="auth-wrap">
      <form className="card auth" onSubmit={submit}>
        <div className="auth-icon"><MedicalIcon name="doctor" size={28} /></div>
        <h1>{t('portal.doctorRegisterTitle')}</h1>
        <label>{t('auth.name')}<input required maxLength={100} value={form.name} onChange={set('name')} /></label>
        <label>{t('auth.email')}<input type="email" required value={form.email} onChange={set('email')} /></label>
        <label>{t('auth.password')}<input type="password" required minLength={8} value={form.password} onChange={set('password')} /><small className="muted">{t('auth.passwordHint')}</small></label>
        <label>{t('portal.specialty')}<input required maxLength={100} value={form.specialty} onChange={set('specialty')} /></label>
        <label>{t('portal.license')}<input required maxLength={50} value={form.licenseNumber} onChange={set('licenseNumber')} /></label>
        <label>{t('auth.language')}
          <select value={form.preferredLanguage} onChange={set('preferredLanguage')}>{languages.map((l) => <option key={l.code} value={l.code}>{l.nativeName} ({l.name})</option>)}</select>
        </label>
        <label>{t('portal.spoken')}<input value={form.spoken} onChange={set('spoken')} /></label>
        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={busy}>{busy ? t('common.loading') : t('portal.requestAccount')}</button>
        <p className="muted"><Link to="/doctor/login">{t('portal.doctorLogin')}</Link></p>
      </form>
    </div>
  );
}
