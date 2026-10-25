import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  if (loading) return <p className="center muted">{t('common.loading')}</p>;
  if (!user) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}
