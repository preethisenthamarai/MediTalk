import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useLanguages from '../hooks/useLanguages';
import MedicalIcon from '../components/MedicalIcon';

const FEATURES = [['language', 'f1'], ['book', 'f2'], ['users', 'f3'], ['chat', 'f4']];

export default function Landing() {
  const { t } = useTranslation();
  const languages = useLanguages();
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-text">
          <h1>{t('landing.title')}</h1>
          <p>{t('landing.subtitle')}</p>
          <div className="hero-actions">
            <Link className="btn big" to="/login"><MedicalIcon name="patient" /> {t('landing.ctaPatient')}</Link>
            <Link className="btn big alt" to="/doctor/login"><MedicalIcon name="doctor" /> {t('landing.ctaDoctor')}</Link>
          </div>
          <div className="chips">{languages.map((l) => <span key={l.code} className="chip">{l.nativeName}</span>)}</div>
        </div>
        <div className="hero-art">
          <div className="care-mark"><MedicalIcon name="medical" size={38} /></div>
          <div className="bubble b1">I have chest pain<small>English</small></div>
          <div className="bubble b2">நெஞ்சு வலி உள்ளது<small>தமிழ்</small></div>
          <div className="bubble b3">Tengo dolor de pecho<small>Español</small></div>
        </div>
      </section>

      <section className="features">
        {FEATURES.map(([icon, k]) => (
          <div key={k} className="card feature"><div className="f-icon"><MedicalIcon name={icon} /></div><h3>{t(`landing.${k}`)}</h3><p className="muted">{t(`landing.${k}t`)}</p></div>
        ))}
      </section>
      <p className="center muted small-text">{t('landing.disclaimer')}</p>
    </div>
  );
}
