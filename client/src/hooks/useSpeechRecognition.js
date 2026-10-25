import { useEffect, useRef, useState } from 'react';

/**
 * Browser speech-to-text (Web Speech API: Chrome / Edge / Safari). Runs on the user's device, so
 * no server cost and low latency. Only FINAL phrases are sent for translation; interim text is shown locally.
 */
export default function useSpeechRecognition({ lang, active, onFinal, onInterim }) {
  const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
  const supported = !!SR;
  const [error, setError] = useState(null);
  const cb = useRef({ onFinal, onInterim });
  cb.current = { onFinal, onInterim };

  useEffect(() => {
    if (!supported || !active) { cb.current.onInterim?.(''); return undefined; }
    const rec = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    let stopped = false;
    setError(null);

    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const r = e.results[i];
        if (r.isFinal) {
          const t = r[0].transcript.trim();
          if (t) cb.current.onFinal?.(t);
        } else interim += r[0].transcript;
      }
      cb.current.onInterim?.(interim);
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { stopped = true; setError(e.error); }
    };
    // Chrome ends recognition after silence; restart while still active
    rec.onend = () => { if (!stopped) { try { rec.start(); } catch { /* already started */ } } };
    try { rec.start(); } catch { /* ignore */ }

    return () => { stopped = true; rec.onend = null; try { rec.stop(); } catch { /* ignore */ } cb.current.onInterim?.(''); };
  }, [SR, supported, lang, active]);

  return { supported, error };
}
