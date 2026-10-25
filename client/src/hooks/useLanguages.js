import { useEffect, useState } from 'react';
import api from '../api/client';
import { FALLBACK_LANGUAGES } from '../utils/languages';

let cached = null;
export default function useLanguages() {
  const [languages, setLanguages] = useState(cached || FALLBACK_LANGUAGES);
  useEffect(() => {
    if (cached) return;
    api.get('/languages').then((r) => { if (r.data.languages?.length) { cached = r.data.languages; setLanguages(cached); } }).catch(() => {});
  }, []);
  return languages;
}
