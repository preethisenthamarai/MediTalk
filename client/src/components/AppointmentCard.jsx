import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Avatar from './Avatar';
import { fmtDate } from '../utils/languages';
import MedicalIcon from './MedicalIcon';

/** One visit. `viewer` decides who we show (doctor sees the patient, patient sees the doctor). */
export default function AppointmentCard({ a, viewer, langName, onCancel, onAddInstructions, highlight, children }) {
  const { t, i18n } = useTranslation();
  const other = viewer === 'doctor' ? a.patient : a.clinician;
  const open = ['scheduled', 'in-progress'].includes(a.status);

  return (
    <article className={`card appt ${highlight ? 'highlight' : ''}`}>
      <div className="appt-head">
        <Avatar name={other?.name || '?'} />
        <div className="grow">
          <strong>{other?.name}</strong>
          <div className="muted small-text">
            {viewer === 'doctor'
              ? <>{t('doctor.speaks')}: <span className="chip">{langName(a.patientLanguage)}</span></>
              : a.clinician?.specialty}
          </div>
        </div>
        <span className={`pill ${a.status}`}>{t(`status.${a.status}`)}</span>
      </div>

      <div className="appt-when"><MedicalIcon name="calendar" /> {fmtDate(a.scheduledAt, i18n.language)}</div>
      {a.reason && <p className="muted">{t('dash.reason')}: {a.reason}</p>}

      {(a.instructionsTranslated || a.instructions) && (
        <div className="notice"><b>{t('dash.instructions')}</b>
          <p>{viewer === 'patient' ? a.instructionsTranslated || a.instructions : a.instructions}</p>
        </div>
      )}

      <div className="row gap wrap">
        {open && <Link className="btn" to={`/room/${a.roomId}`}><MedicalIcon name="video" /> {t('dash.join')}</Link>}
        {['in-progress', 'completed'].includes(a.status) && <Link className="btn ghost" to={`/transcript/${a.roomId}`}><MedicalIcon name="document" /> {t('dash.transcript')}</Link>}
        {open && onCancel && <button className="btn ghost" onClick={() => onCancel(a._id)}>{t('dash.cancel')}</button>}
        {viewer === 'doctor' && onAddInstructions && ['in-progress', 'completed'].includes(a.status) && !a.instructions && (
          <button className="btn ghost" onClick={() => onAddInstructions(a._id)}>{t('dash.addInstructions')}</button>
        )}
      </div>
      {children}
    </article>
  );
}
