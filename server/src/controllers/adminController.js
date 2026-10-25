import Glossary from '../models/Glossary.js';
import Language from '../models/Language.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { str, objectId } from '../utils/validate.js';
import { clearGlossaryCache } from '../services/glossaryService.js';

function cleanTranslations(input) {
  const out = {};
  if (input && typeof input === 'object') {
    for (const [lang, text] of Object.entries(input)) {
      if (typeof text === 'string' && text.trim() && /^[a-z]{2,3}$/.test(lang)) out[lang] = text.trim().slice(0, 200);
    }
  }
  return out;
}

// ---------- Glossary ----------
export const listGlossary = asyncHandler(async (_req, res) => res.json({ glossary: await Glossary.find().sort({ term: 1 }) }));

export const createGlossary = asyncHandler(async (req, res) => {
  const entry = await Glossary.create({
    term: str(req.body.term, 'term', { max: 200 }),
    sourceLang: str(req.body.sourceLang, 'sourceLang', { max: 10, required: false }) || 'en',
    translations: cleanTranslations(req.body.translations),
    category: str(req.body.category, 'category', { max: 50, required: false }) || 'general',
    highRisk: !!req.body.highRisk,
    verified: !!req.body.verified,
  });
  clearGlossaryCache();
  res.status(201).json({ entry });
});

export const updateGlossary = asyncHandler(async (req, res) => {
  const entry = await Glossary.findById(objectId(req.params.id, 'id'));
  if (!entry) throw new ApiError(404, 'Glossary entry not found', 'NOT_FOUND');
  if (req.body.term !== undefined) entry.term = str(req.body.term, 'term', { max: 200 });
  if (req.body.translations !== undefined) entry.translations = cleanTranslations(req.body.translations);
  if (req.body.highRisk !== undefined) entry.highRisk = !!req.body.highRisk;
  if (req.body.verified !== undefined) entry.verified = !!req.body.verified;
  await entry.save();
  clearGlossaryCache();
  res.json({ entry });
});

export const deleteGlossary = asyncHandler(async (req, res) => {
  await Glossary.findByIdAndDelete(objectId(req.params.id, 'id'));
  clearGlossaryCache();
  res.json({ ok: true });
});

// ---------- Languages ----------
export const listAllLanguages = asyncHandler(async (_req, res) => res.json({ languages: await Language.find().sort({ name: 1 }) }));

export const createLanguage = asyncHandler(async (req, res) => {
  const language = await Language.create({
    code: str(req.body.code, 'code', { max: 10 }).toLowerCase(),
    name: str(req.body.name, 'name', { max: 50 }),
    nativeName: str(req.body.nativeName, 'nativeName', { max: 50 }),
    speechCode: str(req.body.speechCode, 'speechCode', { max: 15 }),
    rtl: !!req.body.rtl,
  });
  res.status(201).json({ language });
});

export const updateLanguage = asyncHandler(async (req, res) => {
  const language = await Language.findById(objectId(req.params.id, 'id'));
  if (!language) throw new ApiError(404, 'Language not found', 'NOT_FOUND');
  if (req.body.enabled !== undefined) language.enabled = !!req.body.enabled;
  await language.save();
  res.json({ language });
});
