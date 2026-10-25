import Appointment from '../models/Appointment.js';
import InterpreterRequest from '../models/InterpreterRequest.js';

/** Returns { appointment } if `user` may enter the video room, otherwise null. */
export async function getRoomAccess(user, roomId) {
  const appointment = await Appointment.findOne({ roomId });
  if (!appointment) return null;
  if (['cancelled', 'completed'].includes(appointment.status)) return null;

  const uid = String(user._id);
  if (user.role === 'admin') return { appointment };
  if (String(appointment.patient) === uid || String(appointment.clinician) === uid) return { appointment };

  if (user.role === 'interpreter') {
    const accepted = await InterpreterRequest.exists({ roomId, interpreter: user._id, status: { $in: ['accepted', 'in_progress'] } });
    if (accepted) return { appointment };
  }
  return null;
}
