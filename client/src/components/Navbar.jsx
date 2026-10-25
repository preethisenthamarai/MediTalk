import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSelector from './LanguageSelector';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import MedicalIcon from './MedicalIcon';

export default function Navbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const home = user ? '/dashboard' : '/';

  return (
    <header className="navbar">
      <Link to={home} className="brand"><span className="logo"><MedicalIcon name="medical" size={19} /></span> {t('app.name')}</Link>
      <nav>
        {user && <NavLink to="/dashboard">{t('nav.dashboard')}</NavLink>}
        {user?.role === 'patient' && <NavLink to="/book">{t('nav.book')}</NavLink>}
        {user?.role === 'interpreter' && <NavLink to="/interpreter">{t('nav.interpreter')}</NavLink>}
        {user?.role === 'admin' && <NavLink to="/admin">{t('nav.admin')}</NavLink>}
      </nav>
      <div className="nav-right">
        <LanguageSelector />
        <ThemeToggle />
        {user ? (
          <>
            <NotificationBell />
            <span className="who">{user.name.split(' ')[0]}<small className="role-tag">{t(`roles.${user.role}`)}</small></span>
            <button className="btn ghost small" onClick={() => { logout(); navigate('/'); }}>{t('nav.logout')}</button>
          </>
        ) : (
          <>
            <NavLink to="/login" className="btn ghost small">{t('portal.patient')}</NavLink>
            <NavLink to="/doctor/login" className="btn small">{t('portal.doctor')}</NavLink>
          </>
        )}
      </div>
    </header>
  );
}
