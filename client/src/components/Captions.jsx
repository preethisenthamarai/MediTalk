import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

/** Scrolling transcript: translated text prominent, original beneath it. */
export default function Captions({ captions, interim, selfName, previews = {}, previewLang = '', langName = (c) => c }) {
  const { t } = useTranslation();
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [captions.length, interim]);

  return (
    <div className="captions" aria-live="polite">
      {captions.map((c) => (
        <div key={c.id} className={`cap ${c.own ? 'own' : ''}`}>
          <div className="cap-who">{c.own ? t('room.you') : c.from.name}<span className="role">{t(`roles.${c.from.role}`)}</span></div>
          <div className="cap-text">{c.translated}</div>
          {c.own && previewLang && previews[`${c.id}:${previewLang}`] && <div className="cap-preview">→ {langName(previewLang)}: {previews[`${c.id}:${previewLang}`]}</div>}
          {!c.own && c.sourceLang !== c.targetLang && <div className="cap-orig">{t('room.original')}: {c.original}</div>}
          {c.highRisk && <div className="cap-warn">⚠ {t('room.highRisk')}</div>}
          {c.fallback && <div className="cap-warn">⚠ {t('room.fallback')}</div>}
        </div>
      ))}
      {interim && <div className="cap own interim"><div className="cap-who">{selfName}</div><div className="cap-text">{interim}</div></div>}
      <div ref={end} />
    </div>
  );
}
