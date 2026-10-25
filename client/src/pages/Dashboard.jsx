import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import useLanguages from '../hooks/useLanguages';
import AppointmentCard from '../components/AppointmentCard';
import api, { errMsg } from '../api/client';

/** Patient home */
export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const languages = useLanguages();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const langName = (c) => languages.find((l) => l.code === c)?.nativeName || c;

  const load = useCallback(() => api.get('/appointments').then((r) => setItems(r.data.appointments)).catch((e) => setError(errMsg(e))), []);
  useEffect(() => { load(); }, [load]);
  const cancel = async (id) => { try { await api.patch(`/appointments/${id}/cancel`); load(); } catch (e) { setError(errMsg(e)); } };

  if (!items) return <p className="center muted">{error || t('common.loading')}</p>;
  const open = items.filter((a) => ['scheduled', 'in-progress'].includes(a.status));
  const past = items.filter((a) => !['scheduled', 'in-progress'].includes(a.status)).reverse();

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>{t('doctor.welcome', { name: user.name.split(' ')[0] })}</h1><p className="muted">{t('dash.title')}</p></div>
        <Link className="btn big" to="/book">+ {t('nav.book')}</Link>
      </div>
      {error && <p className="error">{error}</p>}
      {items.length === 0 && <div className="card empty"><p>{t('dash.empty')}</p><Link className="btn" to="/book">+ {t('nav.book')}</Link></div>}

      {open.length > 0 && <><h2 className="section-h">{t('doctor.upcomingList')}</h2>
        <div className="grid">{open.map((a) => <AppointmentCard key={a._id} a={a} viewer="patient" langName={langName} onCancel={cancel} />)}</div></>}
      {past.length > 0 && <><h2 className="section-h">{t('doctor.pastVisits')}</h2>
        <div className="grid">{past.map((a) => <AppointmentCard key={a._id} a={a} viewer="patient" langName={langName} />)}</div></>}
    </div>
  );
}
