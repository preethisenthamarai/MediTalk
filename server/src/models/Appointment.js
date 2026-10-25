import mongoose from 'mongoose';
import { randomUUID } from 'crypto';

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    clinician: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    scheduledAt: { type: Date, required: true, index: true },
    reason: { type: String, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    patientLanguage: { type: String, required: true },
    clinicianLanguage: { type: String, required: true },
    roomId: { type: String, default: () => randomUUID(), unique: true },
    // Written by the clinician (in their language) and auto-translated for the patient
    instructions: { type: String, maxlength: 4000 },
    instructionsTranslated: { type: String, maxlength: 8000 },
  },
  { timestamps: true }
);

appointmentSchema.index({ clinician: 1, scheduledAt: 1 });

export default mongoose.model('Appointment', appointmentSchema);
