import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import ta from './locales/ta.json';
import hi from './locales/hi.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import ar from './locales/ar.json';

export const UI_LANGS = ['en', 'ta', 'hi', 'es', 'fr', 'ar'];
export const RTL_LANGS = ['ar'];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, ta: { translation: ta }, hi: { translation: hi }, es: { translation: es }, fr: { translation: fr }, ar: { translation: ar } },
    fallbackLng: 'en',
    supportedLngs: UI_LANGS,
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage', 'navigator'], lookupLocalStorage: 'tm_lang', caches: ['localStorage'] },
  });

// Keep <html lang> and text direction in sync (Arabic is right-to-left)
const applyDir = (lng) => {
  const code = (lng || 'en').split('-')[0];
  document.documentElement.lang = code;
  document.documentElement.dir = RTL_LANGS.includes(code) ? 'rtl' : 'ltr';
};
applyDir(i18n.language);
i18n.on('languageChanged', applyDir);

export default i18n;
