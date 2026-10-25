import { asyncHandler } from '../utils/asyncHandler.js';
import { str } from '../utils/validate.js';
import Language from '../models/Language.js';
import { ApiError } from '../utils/ApiError.js';
import { translateText } from '../services/translationService.js';

// POST /api/translate  { text, sourceLang, targetLang }
export const translate = asyncHandler(async (req, res) => {
  const text = str(req.body.text, 'text', { max: 2000 });
  const sourceLang = str(req.body.sourceLang, 'sourceLang', { max: 10 });
  const targetLang = str(req.body.targetLang, 'targetLang', { max: 10 });
  const count = await Language.countDocuments({ code: { $in: [sourceLang, targetLang] }, enabled: true });
  if (count < (sourceLang === targetLang ? 1 : 2)) throw new ApiError(400, 'Unsupported language', 'VALIDATION');

  const result = await translateText(text, sourceLang, targetLang);
  res.json({ sourceLang, targetLang, original: text, translated: result.text, ...result, text: undefined });
});

// GET /api/languages  (public, used by the language selectors)
export const listLanguages = asyncHandler(async (_req, res) => {
  const languages = await Language.find({ enabled: true }).sort({ name: 1 });
  res.json({ languages });
});
