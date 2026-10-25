import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import useLanguages from '../hooks/useLanguages';
import AppointmentCard from '../components/AppointmentCard';
import Avatar from '../components/Avatar';
import api, { errMsg } from '../api/client';
import MedicalIcon from '../components/MedicalIcon';

const OPEN = ['scheduled', 'in-progress'];
const STAT_ICONS = { today: 'calendar', upcoming: 'clock', completed: 'check', patients: 'users' };

/** Doctor home: today's schedule, upcoming and past visits, patient list, quick stats. */
export default function DoctorDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const languages = useLanguages();
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [endingId, setEndingId] = useState(null);
  const [instructions, setInstructions] = useState('');
  const langName = (c) => languages.find((l) => l.code === c)?.nativeName || c;

  const load = useCallback(() => api.get('/appointments').then((r) => setItems(r.data.appointments)).catch((e) => setError(errMsg(e))), []);
  useEffect(() => { load(); }, [load]);

  // Coming back from "End visit" inside the call: open the instructions box for that visit
  useEffect(() => {
    const room = params.get('end');
    if (room && items) {
      const a = items.find((x) => x.roomId === room);
      if (a) { setEndingId(a._id); setParams({}, { replace: true }); }
    }
  }, [params, items, setParams]);

  const cancel = async (id) => { try { await api.patch(`/appointments/${id}/cancel`); load(); } catch (e) { setError(errMsg(e)); } };
  const complete = async (id) => {
    try { await api.patch(`/appointments/${id}/complete`, { instructions: instructions || undefined }); setEndingId(null); setInstructions(''); load(); }
    catch (e) { setError(errMsg(e)); }
  };

  const data = useMemo(() => {
    const list = items || [];
    const now = new Date();
    const open = list.filter((a) => OPEN.includes(a.status));
    const today = open.filter((a) => new Date(a.scheduledAt).toDateString() === now.toDateString());
    const later = open.filter((a) => new Date(a.scheduledAt) > now && new Date(a.scheduledAt).toDateString() !== now.toDateString());
    const past = list.filter((a) => !today.includes(a) && !later.includes(a)).reverse();
    const byPatient = new Map();
    list.filter((a) => a.status !== 'cancelled').forEach((a) => {
      const p = byPatient.get(a.patient._id) || { ...a.patient, count: 0, lang: a.patientLanguage };
      p.count += 1; byPatient.set(a.patient._id, p);
    });
    return { today, later, past, patients: [...byPatient.values()], completed: list.filter((a) => a.status === 'completed').length, next: [...today, ...later][0] };
  }, [items]);

  if (!items) return <p className="center muted">{error || t('common.loading')}</p>;

  const card = (a, extra = {}) => (
    <AppointmentCard key={a._id} a={a} viewer="doctor" langName={langName} onCancel={cancel} onAddInstructions={setEndingId} {...extra}>
      {endingId === a._id && (
        <div className="stack">
          <textarea rows={4} maxLength={4000} placeholder={t('dash.instructionsPlaceholder')} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
          <div className="row gap"><button className="btn" onClick={() => complete(a._id)}>{t('common.save')}</button><button className="btn ghost" onClick={() => setEndingId(null)}>{t('common.cancel')}</button></div>
        </div>
      )}
    </AppointmentCard>
  );

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>{t('doctor.welcome', { name: user.name })}</h1><p className="muted">{t('doctor.subtitle')}{user.specialty ? ` · ${user.specialty}` : ''}</p></div>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="stats">
        {['today', 'upcoming', 'completed', 'patients'].map((k) => (
          <div key={k} className="card stat"><span className="stat-icon"><MedicalIcon name={STAT_ICONS[k]} size={22} /></span><div><div className="stat-n">{k === 'today' ? data.today.length : k === 'upcoming' ? data.later.length : k === 'completed' ? data.completed : data.patients.length}</div><div className="muted">{t(`doctor.${k}`)}</div></div></div>
        ))}
      </div>

      <div className="card tips">
        <strong><MedicalIcon name="language" /> {t('doctor.tipTitle')}</strong>
        <ol><li>{t('doctor.tip1')}</li><li>{t('doctor.tip2')}</li><li>{t('doctor.tip3')}</li></ol>
      </div>

      {data.next && <><h2 className="section-h">{t('doctor.nextVisit')}</h2><div className="grid one">{card(data.next, { highlight: true })}</div></>}

      <h2 className="section-h">{t('doctor.todaySchedule')}</h2>
      {data.today.length === 0 ? <p className="muted">{t('doctor.noToday')}</p> : <div className="grid">{data.today.filter((a) => a !== data.next).map((a) => card(a))}</div>}

      {data.later.filter((a) => a !== data.next).length > 0 && <><h2 className="section-h">{t('doctor.upcomingList')}</h2><div className="grid">{data.later.filter((a) => a !== data.next).map((a) => card(a))}</div></>}

      <h2 className="section-h">{t('doctor.myPatients')}</h2>
      {data.patients.length === 0 ? <p className="muted">{t('doctor.none')}</p> : (
        <div className="grid small">{data.patients.map((p) => (
          <div key={p._id} className="card patient-row"><Avatar name={p.name} /><div className="grow"><strong>{p.name}</strong><div className="muted small-text">{t('doctor.speaks')}: {langName(p.lang)} · {p.count} {t('doctor.visits')}</div></div></div>
        ))}</div>
      )}

      {data.past.length > 0 && <><h2 className="section-h">{t('doctor.pastVisits')}</h2><div className="grid">{data.past.map((a) => card(a))}</div></>}
    </div>
  );
}
