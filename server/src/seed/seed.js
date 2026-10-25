import mongoose from 'mongoose';
import { env } from '../config/env.js';
import User from '../models/User.js';
import Language from '../models/Language.js';
import Glossary from '../models/Glossary.js';

const fresh = process.argv.includes('--fresh');

const languages = [
  { code: 'en', name: 'English', nativeName: 'English', speechCode: 'en-US' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', speechCode: 'ta-IN' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', speechCode: 'hi-IN' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', speechCode: 'es-ES' },
  { code: 'fr', name: 'French', nativeName: 'Français', speechCode: 'fr-FR' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', speechCode: 'ar-SA', rtl: true },
];

// STARTER glossary only. These MUST be reviewed by a qualified medical translator before real use.
const g = (term, category, highRisk, es, hi, ta, fr, ar) => ({
  term, category, highRisk, sourceLang: 'en', verified: false, translations: { es, hi, ta, fr, ar },
});
const glossary = [
  g('chest pain', 'symptom', true, 'dolor de pecho', 'सीने में दर्द', 'நெஞ்சு வலி', 'douleur thoracique', 'ألم في الصدر'),
  g('shortness of breath', 'symptom', true, 'falta de aire', 'सांस लेने में तकलीफ', 'மூச்சுத் திணறல்', 'essoufflement', 'ضيق التنفس'),
  g('allergy', 'condition', true, 'alergia', 'एलर्जी', 'ஒவ்வாமை', 'allergie', 'حساسية'),
  g('blood pressure', 'measurement', false, 'presión arterial', 'रक्तचाप', 'இரத்த அழுத்தம்', 'tension artérielle', 'ضغط الدم'),
  g('diabetes', 'condition', false, 'diabetes', 'मधुमेह', 'நீரிழிவு நோய்', 'diabète', 'السكري'),
  g('fever', 'symptom', false, 'fiebre', 'बुखार', 'காய்ச்சல்', 'fièvre', 'حمى'),
  g('headache', 'symptom', false, 'dolor de cabeza', 'सिरदर्द', 'தலைவலி', 'mal de tête', 'صداع'),
  g('prescription', 'medication', false, 'receta', 'नुस्खा', 'மருந்துச் சீட்டு', 'ordonnance', 'وصفة طبية'),
  g('nausea', 'symptom', false, 'náuseas', 'मतली', 'குமட்டல்', 'nausées', 'غثيان'),
  g('vomiting', 'symptom', false, 'vómitos', 'उल्टी', 'வாந்தி', 'vomissements', 'قيء'),
  g('cough', 'symptom', false, 'tos', 'खांसी', 'இருமல்', 'toux', 'سعال'),
  g('asthma', 'condition', false, 'asma', 'दमा', 'ஆஸ்துமா', 'asthme', 'الربو'),
  g('dizziness', 'symptom', false, 'mareo', 'चक्कर आना', 'தலைச்சுற்றல்', 'vertiges', 'دوخة'),
  g('insulin', 'medication', false, 'insulina', 'इंसुलिन', 'இன்சுலின்', 'insuline', 'الإنسولين'),
  g('antibiotic', 'medication', false, 'antibiótico', 'एंटीबायोटिक', 'நுண்ணுயிர் எதிர்ப்பி', 'antibiotique', 'مضاد حيوي'),
];

const users = [
  { name: 'Admin User', email: 'admin@telemed.test', password: 'Admin@12345', role: 'admin', preferredLanguage: 'en' },
  { name: 'Dr. Priya Raman', email: 'doctor@telemed.test', password: 'Doctor@12345', role: 'clinician', preferredLanguage: 'en', spokenLanguages: ['en', 'ta'], specialty: 'General Medicine' },
  { name: 'Dr. Alex Morgan', email: 'doctor2@telemed.test', password: 'Doctor@12345', role: 'clinician', preferredLanguage: 'en', spokenLanguages: ['en'], specialty: 'Cardiology' },
  { name: 'Meena Kumar (Tamil patient)', email: 'patient.ta@telemed.test', password: 'Patient@12345', role: 'patient', preferredLanguage: 'ta' },
  { name: 'Lucía Gómez (Spanish patient)', email: 'patient.es@telemed.test', password: 'Patient@12345', role: 'patient', preferredLanguage: 'es' },
  { name: 'Ravi Interpreter', email: 'interpreter@telemed.test', password: 'Interp@12345', role: 'interpreter', preferredLanguage: 'en', spokenLanguages: ['en', 'ta', 'hi', 'es'] },
];

await mongoose.connect(env.mongoUri);
if (fresh) {
  await mongoose.connection.dropDatabase();
  console.log('Database dropped');
}

for (const l of languages) await Language.updateOne({ code: l.code }, { $setOnInsert: l }, { upsert: true });
for (const e of glossary) await Glossary.updateOne({ term: e.term, sourceLang: e.sourceLang }, { $setOnInsert: e }, { upsert: true });
for (const u of users) {
  if (!(await User.exists({ email: u.email }))) await User.create(u); // create() so the password is hashed
}

console.log('\nSeed complete. Demo accounts:');
for (const u of users) console.log(`  ${u.role.padEnd(12)} ${u.email.padEnd(28)} ${u.password}`);
console.log('\nChange or delete these accounts before deploying anywhere public.\n');
await mongoose.disconnect();
