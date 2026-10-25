import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api, { errMsg } from '../api/client';
import { fmtDate } from '../utils/languages';
import MedicalIcon from './MedicalIcon';

export default function NotificationBell() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [markingRead, setMarkingRead] = useState(false);
  const latestLoad = useRef(0);

  const load = useCallback(async () => {
    const request = ++latestLoad.current;
    try {
      const { data } = await api.get('/notifications');
      if (request !== latestLoad.current) return;
      setItems(data.notifications);
      setUnread(data.unread);
      setError('');
    } catch (loadError) {
      if (request === latestLoad.current) setError(errMsg(loadError));
    }
  }, []);
  useEffect(() => { load(); const id = setInterval(load, 30000); return () => clearInterval(id); }, [load]);

  const text = (n) => {
    const d = { ...n.data };
    if (d.when) d.when = fmtDate(d.when, i18n.language);
    return t(`notif.${n.type}`, d);
  };
  const markRead = async () => {
    setMarkingRead(true);
    setError('');
    try {
      await api.patch('/notifications/read-all');
      latestLoad.current += 1;
      setItems([]);
      setUnread(0);
    } catch (markError) {
      setError(errMsg(markError));
    } finally {
      setMarkingRead(false);
    }
  };

  return (
    <div className="bell">
      <button className="icon-btn" onClick={() => { setOpen(!open); if (!open) load(); }} aria-label={t('dash.notifications')}>
        <MedicalIcon name="bell" />{unread > 0 && <span className="badge">{unread}</span>}
      </button>
      {open && (
        <div className="bell-menu card">
          <div className="row between"><strong>{t('dash.notifications')}</strong><button className="link" onClick={markRead} disabled={markingRead || unread === 0}>{t('dash.markRead')}</button></div>
          {error && <p className="error" role="alert">{error}</p>}
          {!error && items.length === 0 && <p className="muted">{t('dash.noNotifications')}</p>}
          <ul>{items.map((n) => <li key={n._id} className={n.read ? '' : 'unread'}>{text(n)}<small>{fmtDate(n.createdAt, i18n.language)}</small></li>)}</ul>
        </div>
      )}
    </div>
  );
}
