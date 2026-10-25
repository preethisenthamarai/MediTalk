import { env } from '../config/env.js';
import { protectTerms } from './glossaryService.js';

const cfg = env.translation;

async function fetchJson(url, options = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), cfg.timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    if (!res.ok) throw new Error(`Translation provider HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

const providers = {
  // Offline stub for UI testing
  async mock(text, source, target) {
    return `[${target}] ${text}`;
  },

  // Free, no key. Daily quota is small; fine for demos.
  async mymemory(text, source, target) {
    const params = new URLSearchParams({ q: text, langpair: `${source}|${target}` });
    if (cfg.myMemoryEmail) params.set('de', cfg.myMemoryEmail);
    const data = await fetchJson(`https://api.mymemory.translated.net/get?${params}`);
    if (data.responseStatus && Number(data.responseStatus) !== 200) {
      throw new Error(`MyMemory: ${data.responseDetails || data.responseStatus}`);
    }
    return data.responseData.translatedText;
  },

  // Google Cloud Translation v2 (needs an API key)
  async google(text, source, target) {
    if (!cfg.googleKey) throw new Error('GOOGLE_TRANSLATE_API_KEY is not set');
    const data = await fetchJson(`https://translation.googleapis.com/language/translate/v2?key=${cfg.googleKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source, target, format: 'text' }),
    });
    return data.data.translations[0].translatedText;
  },

  // Self-hosted or hosted LibreTranslate
  async libretranslate(text, source, target) {
    const data = await fetchJson(`${cfg.libreUrl.replace(/\/$/, '')}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source, target, format: 'text', api_key: cfg.libreKey || undefined }),
    });
    return data.translatedText;
  },
};

/**
 * Translate `text` from `source` to `target`, protecting medical-glossary terms.
 * Never throws: on provider failure returns the original text with `fallback: true`
 * so the call can continue and the UI can suggest an interpreter.
 */
export async function translateText(text, source, target) {
  const started = Date.now();
  if (!text || source === target) {
    return { text, provider: 'none', glossaryHits: [], highRisk: false, fallback: false, latencyMs: 0 };
  }

  const provider = providers[cfg.provider] ? cfg.provider : 'mymemory';
  let hits = [];
  let highRisk = false;

  try {
    // Inside the try: protectTerms hits the database, and a DB hiccup must not crash a live call
    const protectedResult = await protectTerms(text, source, target);
    hits = protectedResult.hits;
    highRisk = protectedResult.highRisk;
    const raw = await providers[provider](protectedResult.protectedText, source, target);
    return {
      text: protectedResult.restore(decodeEntities(raw)),
      provider,
      glossaryHits: hits,
      highRisk,
      fallback: false,
      latencyMs: Date.now() - started,
    };
  } catch (err) {
    console.error(`[translate:${provider}] ${source}->${target} failed: ${err.message}`);
    return { text, provider, glossaryHits: hits, highRisk, fallback: true, latencyMs: Date.now() - started };
  }
}

// Some providers return HTML entities (e.g. &#39;)
function decodeEntities(s) {
  return String(s)
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
