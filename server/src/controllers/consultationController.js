import Appointment from '../models/Appointment.js';
import Consultation from '../models/Consultation.js';
import Translation from '../models/Translation.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/consultations/:roomId/transcript
export const getTranscript = asyncHandler(async (req, res) => {
  const appt = await Appointment.findOne({ roomId: req.params.roomId }).populate('patient clinician', 'name');
  if (!appt) throw new ApiError(404, 'Consultation not found', 'NOT_FOUND');
  const uid = String(req.user._id);
  if (req.user.role !== 'admin' && String(appt.patient._id) !== uid && String(appt.clinician._id) !== uid) {
    throw new ApiError(403, 'Not your consultation', 'FORBIDDEN');
  }
  const consultation = await Consultation.findOne({ roomId: appt.roomId });
  const rows = consultation ? await Translation.find({ consultation: consultation._id }).sort({ createdAt: 1 }) : [];

  // Group the per-language rows back into one entry per utterance
  const lines = new Map();
  for (const r of rows) {
    if (!lines.has(r.captionId)) {
      lines.set(r.captionId, { id: r.captionId, at: r.createdAt, speaker: r.speakerName, role: r.speakerRole, sourceLang: r.sourceLang, original: r.sourceText, translations: {} });
    }
    if (r.targetLang !== r.sourceLang) lines.get(r.captionId).translations[r.targetLang] = r.translatedText;
  }
  res.json({ appointment: appt, transcript: [...lines.values()] });
});
