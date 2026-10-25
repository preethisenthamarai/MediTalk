import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { str, objectId } from '../utils/validate.js';
import { notify } from '../services/notify.js';
import { translateText } from '../services/translationService.js';

const populate = [
  { path: 'patient', select: 'name email preferredLanguage' },
  { path: 'clinician', select: 'name email preferredLanguage specialty' },
];

function assertParticipant(appt, user) {
  const uid = String(user._id);
  const ok = user.role === 'admin' || String(appt.patient._id || appt.patient) === uid || String(appt.clinician._id || appt.clinician) === uid;
  if (!ok) throw new ApiError(403, 'Not your appointment', 'FORBIDDEN');
}

// POST /api/appointments  (patient books a video consultation)
export const createAppointment = asyncHandler(async (req, res) => {
  const clinicianId = objectId(req.body.clinicianId, 'clinicianId');
  const reason = str(req.body.reason, 'reason', { max: 1000, required: false });
  const when = new Date(req.body.scheduledAt);
  if (Number.isNaN(when.getTime())) throw new ApiError(400, 'scheduledAt is not a valid date', 'VALIDATION');
  if (when.getTime() < Date.now() - 60_000) throw new ApiError(400, 'scheduledAt must be in the future', 'VALIDATION');

  const clinician = await User.findOne({ _id: clinicianId, role: 'clinician', active: true, approved: { $ne: false } });
  if (!clinician) throw new ApiError(404, 'Clinician not found', 'NOT_FOUND');

  // Prevent double-booking the same clinician within 30 minutes
  const clash = await Appointment.exists({
    clinician: clinician._id,
    status: { $in: ['scheduled', 'in-progress'] },
    scheduledAt: { $gt: new Date(when.getTime() - 30 * 60_000), $lt: new Date(when.getTime() + 30 * 60_000) },
  });
  if (clash) throw new ApiError(409, 'That time slot is already taken', 'SLOT_TAKEN');

  const appt = await Appointment.create({
    patient: req.user._id,
    clinician: clinician._id,
    scheduledAt: when,
    reason,
    patientLanguage: req.user.preferredLanguage,
    clinicianLanguage: clinician.preferredLanguage,
  });

  const io = req.app.get('io');
  const data = { appointmentId: appt._id, when, patientName: req.user.name, clinicianName: clinician.name };
  await notify(io, clinician._id, 'appointment_booked_clinician', data);
  await notify(io, req.user._id, 'appointment_booked_patient', data);

  res.status(201).json({ appointment: await appt.populate(populate) });
});

// GET /api/appointments  (a user's own appointments; admin sees all)
export const listAppointments = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'patient') filter.patient = req.user._id;
  else if (req.user.role === 'clinician') filter.clinician = req.user._id;
  else if (req.user.role !== 'admin') return res.json({ appointments: [] });
  if (req.query.status) filter.status = String(req.query.status);

  const appointments = await Appointment.find(filter).populate(populate).sort({ scheduledAt: 1 }).limit(200);
  res.json({ appointments });
});

// GET /api/appointments/:id
export const getAppointment = asyncHandler(async (req, res) => {
  const appt = await Appointment.findById(objectId(req.params.id, 'id')).populate(populate);
  if (!appt) throw new ApiError(404, 'Appointment not found', 'NOT_FOUND');
  assertParticipant(appt, req.user);
  res.json({ appointment: appt });
});

// PATCH /api/appointments/:id/cancel
export const cancelAppointment = asyncHandler(async (req, res) => {
  const appt = await Appointment.findById(objectId(req.params.id, 'id')).populate(populate);
  if (!appt) throw new ApiError(404, 'Appointment not found', 'NOT_FOUND');
  assertParticipant(appt, req.user);
  if (['completed', 'cancelled'].includes(appt.status)) throw new ApiError(400, `Appointment already ${appt.status}`, 'BAD_STATE');
  appt.status = 'cancelled';
  await appt.save();

  const io = req.app.get('io');
  const other = String(appt.patient._id) === String(req.user._id) ? appt.clinician._id : appt.patient._id;
  await notify(io, other, 'appointment_cancelled', { appointmentId: appt._id, when: appt.scheduledAt, by: req.user.name });
  res.json({ appointment: appt });
});

// PATCH /api/appointments/:id/complete  (clinician ends the visit, optionally adds instructions)
export const completeAppointment = asyncHandler(async (req, res) => {
  const appt = await Appointment.findById(objectId(req.params.id, 'id')).populate(populate);
  if (!appt) throw new ApiError(404, 'Appointment not found', 'NOT_FOUND');
  if (req.user.role !== 'admin' && String(appt.clinician._id) !== String(req.user._id)) {
    throw new ApiError(403, 'Only the clinician can complete a visit', 'FORBIDDEN');
  }
  const text = str(req.body.instructions, 'instructions', { max: 4000, required: false });
  if (text) {
    appt.instructions = text;
    // Translate the visit instructions into the patient's own language
    const t = await translateText(text, appt.clinicianLanguage, appt.patientLanguage);
    appt.instructionsTranslated = t.text;
  }
  appt.status = 'completed';
  await appt.save();

  const io = req.app.get('io');
  io?.to(appt.roomId).emit('room-ended');
  await notify(io, appt.patient._id, 'visit_completed', { appointmentId: appt._id, clinicianName: appt.clinician.name });
  res.json({ appointment: appt });
});
