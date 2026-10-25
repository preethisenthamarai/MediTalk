import mongoose from 'mongoose';

// One document per video session (room). The transcript lines live in the Translation collection.
const consultationSchema = new mongoose.Schema(
  {
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true, index: true },
    roomId: { type: String, required: true, unique: true },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: String,
        joinedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('Consultation', consultationSchema);
