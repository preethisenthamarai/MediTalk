// Fallback list used until /api/languages responds (and if it fails)
export const FALLBACK_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', speechCode: 'en-US' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', speechCode: 'ta-IN' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', speechCode: 'hi-IN' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', speechCode: 'es-ES' },
  { code: 'fr', name: 'French', nativeName: 'Français', speechCode: 'fr-FR' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', speechCode: 'ar-SA' },
];

export const fmtDate = (d, lang) =>
  new Date(d).toLocaleString(lang || undefined, { dateStyle: 'medium', timeStyle: 'short' });

export const toLocalInput = (date) => {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
};
