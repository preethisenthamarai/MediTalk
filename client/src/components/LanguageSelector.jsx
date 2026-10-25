import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import useLanguages from '../hooks/useLanguages';
import { UI_LANGS } from '../i18n';
import MedicalIcon from './MedicalIcon';

/** Shown on every screen (navbar). Changes UI language and, if logged in, the saved/translation language. */
export default function LanguageSelector({ className = '' }) {
  const { i18n, t } = useTranslation();
  const { setLanguage } = useAuth();
  const languages = useLanguages().filter((l) => UI_LANGS.includes(l.code));
  const current = (i18n.resolvedLanguage || 'en').split('-')[0];

  return (
    <label className={`lang-select ${className}`}>
      <MedicalIcon name="language" />
      <select aria-label={t('nav.language')} value={current} onChange={(e) => setLanguage(e.target.value)}>
        {languages.map((l) => <option key={l.code} value={l.code}>{l.nativeName}</option>)}
      </select>
    </label>
  );
}
