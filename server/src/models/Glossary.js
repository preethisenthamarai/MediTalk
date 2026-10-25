import mongoose from 'mongoose';

const glossarySchema = new mongoose.Schema(
  {
    term: { type: String, required: true, trim: true }, // term in sourceLang
    sourceLang: { type: String, required: true, default: 'en' },
    translations: { type: Map, of: String, default: {} }, // langCode -> approved translation
    category: { type: String, default: 'general' },
    // High-risk terms trigger an "ask for an interpreter" suggestion in the call UI
    highRisk: { type: Boolean, default: false },
    // Set to true only after a qualified medical translator has reviewed the entry
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

glossarySchema.index({ term: 1, sourceLang: 1 }, { unique: true });

export default mongoose.model('Glossary', glossarySchema);
