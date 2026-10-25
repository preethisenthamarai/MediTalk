import mongoose from 'mongoose';

// One row per (caption, target language). The row where targetLang === sourceLang is the original utterance.
const translationSchema = new mongoose.Schema(
  {
    consultation: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation', index: true },
    captionId: { type: String, index: true },
    speaker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    speakerName: String,
    speakerRole: String,
    sourceLang: { type: String, required: true, index: true },
    targetLang: { type: String, required: true, index: true },
    sourceText: { type: String, required: true },
    translatedText: { type: String, required: true },
    glossaryHits: [String],
    provider: String,
    latencyMs: Number,
    fallback: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Translation', translationSchema);
