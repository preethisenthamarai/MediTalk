import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api/client';
import MedicalIcon from '../components/MedicalIcon';

const CONFIG = {
  patient: { icon: 'patient', title: 'portal.patientLogin', sub: 'portal.patientSub', register: { to: '/register', label: 'nav.register', ask: 'auth.noAccount' }, others: [['/doctor/login', 'portal.areDoctor'], ['/staff/login', 'portal.staffLink']] },
  doctor: { icon: 'doctor', title: 'portal.doctorLogin', sub: 'portal.doctorSub', register: { to: '/doctor/register', label: 'portal.requestAccount', ask: 'portal.newDoctor' }, others: [['/login', 'portal.arePatient'], ['/staff/login', 'portal.staffLink']] },
  staff: { icon: 'staff', title: 'portal.staffLogin', sub: 'portal.staffSub', register: null, others: [['/login', 'portal.arePatient'], ['/doctor/login', 'portal.areDoctor']] },
};

/** One login screen used by the three portals (patient / doctor / staff). */
export default function AuthPortal({ portal }) {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const cfg = CONFIG[portal];
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const user = await login(form.email, form.password, portal);
      navigate(user.role === 'interpreter' ? '/interpreter' : user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      const d = err?.response?.data;
      if (d?.code === 'WRONG_PORTAL') setError(t('portal.wrong', { account: t(`portal.${d.accountPortal}`).toLowerCase() }));
      else if (d?.code === 'PENDING_APPROVAL') setError(t('portal.pending'));
      else setError(errMsg(err, t('common.error')));
    } finally { setBusy(false); }
  };

  return (
    <div className="auth-wrap">
      <form className="card auth" onSubmit={submit}>
        <div className="auth-icon"><MedicalIcon name={cfg.icon} size={28} /></div>
        <h1>{t(cfg.title)}</h1>
        <p className="muted">{t(cfg.sub)}</p>
        <label>{t('auth.email')}<input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>{t('auth.password')}<input type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={busy}>{busy ? t('common.loading') : t('nav.login')}</button>
        {cfg.register && <p className="muted">{t(cfg.register.ask)} <Link to={cfg.register.to}>{t(cfg.register.label)}</Link></p>}
        <div className="auth-links">{cfg.others.map(([to, label]) => <Link key={to} to={to}>{t(label)}</Link>)}</div>
      </form>
    </div>
  );
}
