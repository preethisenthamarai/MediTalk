import Glossary from '../models/Glossary.js';

let cache = { at: 0, entries: [] };
const TTL_MS = 60_000;

export function clearGlossaryCache() {
  cache = { at: 0, entries: [] };
}

async function getEntries() {
  if (Date.now() - cache.at > TTL_MS) {
    const docs = await Glossary.find().lean();
    cache = {
      at: Date.now(),
      entries: docs.map((d) => ({
        term: d.term,
        highRisk: !!d.highRisk,
        // Every language this concept is known in, including the source term itself
        map: { ...(d.translations || {}), [d.sourceLang]: d.term },
      })),
    };
  }
  return cache.entries;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Replace glossary terms in `text` with opaque tokens so the machine translator cannot mangle them.
 * Returns the protected text and a `restore(translated)` function that swaps tokens for approved translations.
 */
export async function protectTerms(text, source, target) {
  const entries = (await getEntries())
    .filter((e) => e.map[source] && e.map[target])
    .sort((a, b) => b.map[source].length - a.map[source].length);

  const used = [];
  let out = text;
  for (const entry of entries) {
    // Unicode-aware "whole word" match that also works for Tamil/Hindi/Arabic scripts
    const re = new RegExp(`(?<![\\p{L}\\p{N}\\p{M}])${escapeRe(entry.map[source])}(?![\\p{L}\\p{N}\\p{M}])`, 'giu');
    if (re.test(out)) {
      re.lastIndex = 0;
      const idx = used.length;
      out = out.replace(re, ` QXZ${idx}ZXQ `);
      used.push({ idx, from: entry.map[source], to: entry.map[target], highRisk: entry.highRisk });
    }
  }

  const restore = (translated) => {
    let result = translated;
    for (const u of used) {
      const tokenRe = new RegExp(`QXZ\\s*${u.idx}\\s*ZXQ`, 'gi');
      if (tokenRe.test(result)) {
        result = result.replace(tokenRe, u.to);
      } else {
        // The MT engine dropped the token: append the approved term so it is never lost
        result = `${result} [${u.to}]`;
      }
    }
    return result.replace(/\s{2,}/g, ' ').trim();
  };

  return {
    protectedText: out.replace(/\s{2,}/g, ' ').trim(),
    restore,
    hits: used.map((u) => u.from),
    highRisk: used.some((u) => u.highRisk),
  };
}
