import mongoose from 'mongoose';

const interpreterRequestSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    language: { type: String, required: true, index: true }, // language the interpreter must speak
    reason: { type: String, maxlength: 500 },
    urgency: { type: String, enum: ['normal', 'high'], default: 'normal' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    interpreter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    acceptedAt: Date,
    startedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model('InterpreterRequest', interpreterRequestSchema);
