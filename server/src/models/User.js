import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const ROLES = ['patient', 'clinician', 'interpreter', 'admin'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ROLES, default: 'patient', index: true },
    preferredLanguage: { type: String, default: 'en', index: true },
    // Languages a clinician / interpreter can speak (used to match interpreter requests)
    spokenLanguages: { type: [String], default: [] },
    specialty: { type: String, trim: true },
    active: { type: Boolean, default: true },
    // Doctors who sign up themselves start unapproved; an admin approves them. Everyone else is approved by default.
    approved: { type: Boolean, default: true },
    licenseNumber: { type: String, trim: true, maxlength: 50 },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
