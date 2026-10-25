import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import useLanguages from '../hooks/useLanguages';
import { UI_LANGS } from '../i18n';
import { errMsg } from '../api/client';

export default function Register() {
  const { t, i18n } = useTranslation();
  const { register } = useAuth();
  const languages = useLanguages().filter((l) => UI_LANGS.includes(l.code));
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', preferredLanguage: (i18n.resolvedLanguage || 'en').split('-')[0] });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { await register(form); navigate('/dashboard'); }
    catch (err) { setError(errMsg(err, t('common.error'))); } finally { setBusy(false); }
  };

  return (
    <div className="auth-wrap">
      <form className="card auth" onSubmit={submit}>
        <h1>{t('auth.registerTitle')}</h1>
        <label>{t('auth.name')}<input required maxLength={100} value={form.name} onChange={set('name')} /></label>
        <label>{t('auth.email')}<input type="email" required value={form.email} onChange={set('email')} /></label>
        <label>{t('auth.password')}<input type="password" required minLength={8} value={form.password} onChange={set('password')} /><small className="muted">{t('auth.passwordHint')}</small></label>
        <label>{t('auth.language')}
          <select value={form.preferredLanguage} onChange={(e) => { set('preferredLanguage')(e); i18n.changeLanguage(e.target.value); }}>
            {languages.map((l) => <option key={l.code} value={l.code}>{l.nativeName} ({l.name})</option>)}
          </select>
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={busy}>{busy ? t('common.loading') : t('nav.register')}</button>
        <p className="muted">{t('auth.haveAccount')} <Link to="/login">{t('nav.login')}</Link></p>
      </form>
    </div>
  );
}
