import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api, { tokens } from '../api/client';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const { i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!tokens.access);

  const applyUser = useCallback((u) => {
    setUser(u);
    if (u?.preferredLanguage) i18n.changeLanguage(u.preferredLanguage);
  }, [i18n]);

  useEffect(() => {
    if (!tokens.access) return;
    api.get('/auth/me').then((r) => applyUser(r.data.user)).catch(() => tokens.clear()).finally(() => setLoading(false));
  }, [applyUser]);

  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('tm:logout', onLogout);
    return () => window.removeEventListener('tm:logout', onLogout);
  }, []);

  const login = async (email, password, portal) => {
    const { data } = await api.post('/auth/login', { email, password, portal });
    tokens.set(data);
    applyUser(data.user);
    return data.user;
  };

  const register = async (form) => {
    const { data } = await api.post('/auth/register', form);
    tokens.set(data);
    applyUser(data.user);
    return data.user;
  };

  const logout = () => { tokens.clear(); setUser(null); };

  // Changing the language updates the UI immediately and, when logged in, the saved profile (used for translation)
  const setLanguage = async (code) => {
    i18n.changeLanguage(code);
    if (user && user.preferredLanguage !== code) {
      try {
        const { data } = await api.patch('/auth/me', { preferredLanguage: code });
        setUser(data.user);
      } catch { /* UI language still changed locally */ }
    }
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout, setLanguage }}>{children}</AuthContext.Provider>;
}
