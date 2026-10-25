import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api, { errMsg } from '../api/client';
import { fmtDate } from '../utils/languages';

export default function TranscriptPage() {
  const { roomId } = useParams();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api.get(`/consultations/${roomId}/transcript`).then((r) => setData(r.data)).catch((e) => setError(errMsg(e))); }, [roomId]);
  if (error) return <p className="center error">{error}</p>;
  if (!data) return <p className="center muted">{t('common.loading')}</p>;

  return (
    <div className="page narrow">
      <Link to="/dashboard">← {t('common.back')}</Link>
      <h1>{t('dash.transcript')}</h1>
      <div className="stack">
        {data.transcript.length === 0 && <p className="muted">—</p>}
        {data.transcript.map((l) => {
          const mine = l.translations[user.preferredLanguage];
          return (
            <div key={l.id} className="card cap">
              <div className="cap-who">{l.speaker}<span className="role">{t(`roles.${l.role}`)}</span><small className="muted"> {fmtDate(l.at, i18n.language)}</small></div>
              <div className="cap-text">{mine || l.original}</div>
              {mine && <div className="cap-orig">{t('room.original')} ({l.sourceLang}): {l.original}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
