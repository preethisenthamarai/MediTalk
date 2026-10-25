import mongoose from 'mongoose';

const languageSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // ISO 639-1, used for translation APIs and i18n
  name: { type: String, required: true },
  nativeName: { type: String, required: true },
  speechCode: { type: String, required: true }, // BCP-47 for browser speech recognition
  rtl: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true },
});

export default mongoose.model('Language', languageSchema);
