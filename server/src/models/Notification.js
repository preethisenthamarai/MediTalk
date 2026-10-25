import mongoose from 'mongoose';

// Stores a type + data (not text) so the client can render it in the user's own language.
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
