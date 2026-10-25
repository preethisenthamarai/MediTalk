import InterpreterRequest from '../models/InterpreterRequest.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { str, oneOf, objectId } from '../utils/validate.js';
import { getRoomAccess } from '../services/roomAccess.js';
import { notify } from '../services/notify.js';

const populate = [
  { path: 'requestedBy', select: 'name role' },
  { path: 'interpreter', select: 'name' },
];

// POST /api/interpreters/request  (patient or clinician, from inside the call)
export const requestInterpreter = asyncHandler(async (req, res) => {
  const roomId = str(req.body.roomId, 'roomId', { max: 100 });
  const requestedLanguage = str(req.body.language, 'language', { max: 10, required: false });
  const reason = str(req.body.reason, 'reason', { max: 500, required: false });
  const urgency = oneOf(req.body.urgency, 'urgency', ['normal', 'high'], { required: false }) || 'normal';

  const access = await getRoomAccess(req.user, roomId);
  if (!access || !['patient', 'clinician', 'admin'].includes(req.user.role)) {
    throw new ApiError(403, 'You cannot request an interpreter for this room', 'FORBIDDEN');
  }

  // The appointment's patient language is authoritative; never trust a caller to request a different patient's language.
  const patient = await User.findById(access.appointment.patient).select('preferredLanguage');
  const language = access.appointment.patientLanguage || patient?.preferredLanguage || requestedLanguage || req.user.preferredLanguage || 'en';
  // One open request per room. A duplicate request returns the existing authoritative state.
  const existing = await InterpreterRequest.findOne({ roomId, status: { $in: ['pending', 'accepted', 'in_progress'] } });
  if (existing) return res.json({ request: await existing.populate(populate), alreadyRequested: true });

  const request = await InterpreterRequest.create({
    roomId, language, reason, urgency, requestedBy: req.user._id, appointment: access.appointment._id,
  });
  await request.populate(populate);

  // Real-time push to every interpreter currently online
  req.app.get('io')?.to('interpreters').emit('interpreter-request', request);
  res.status(201).json({ request });
});

// GET /api/interpreters/pending  (interpreter dashboard; filtered by languages the interpreter speaks)
export const listPending = asyncHandler(async (req, res) => {
  const filter = { status: 'pending' };
  if (req.user.role !== 'interpreter') throw new ApiError(403, 'Interpreter account required', 'FORBIDDEN');
  if (req.user.spokenLanguages?.length) filter.language = { $in: req.user.spokenLanguages };
  else filter._id = { $exists: false }; // no configured spoken languages means no requests are offered
  const [pending, mine] = await Promise.all([
    InterpreterRequest.find(filter).populate(populate).sort({ urgency: 1, createdAt: 1 }).limit(100),
    InterpreterRequest.find({ interpreter: req.user._id, status: { $in: ['accepted', 'in_progress'] } }).populate(populate).sort({ acceptedAt: -1 }).limit(50),
  ]);
  res.json({ pending, mine });
});

// POST /api/interpreters/:id/accept
export const acceptRequest = asyncHandler(async (req, res) => {
  // Atomic: only one interpreter can win the request
  const interpreter = await User.findOne({ _id: req.user._id, role: 'interpreter', active: true, approved: { $ne: false } });
  if (!interpreter) throw new ApiError(403, 'Interpreter account is disabled', 'FORBIDDEN');
  const request = await InterpreterRequest.findOneAndUpdate(
    { _id: objectId(req.params.id, 'id'), status: 'pending', language: { $in: interpreter.spokenLanguages || [] } },
    { status: 'accepted', interpreter: req.user._id, acceptedAt: new Date() },
    { new: true }
  ).populate(populate);
  if (!request) throw new ApiError(409, 'Request no longer available', 'TAKEN');

  const io = req.app.get('io');
  io?.to(request.roomId).emit('interpreter-accepted', { name: req.user.name, language: request.language, status: request.status });
  io?.to(`user:${request.requestedBy._id}`).emit('interpreter-accepted', { name: req.user.name, language: request.language, roomId: request.roomId, status: request.status });
  io?.to('interpreters').emit('interpreter-request-taken', { id: request._id });
  await notify(io, request.requestedBy._id, 'interpreter_accepted', { interpreterName: req.user.name, language: request.language });
  res.json({ request, roomId: request.roomId });
});

// POST /api/interpreters/:id/complete
export const completeRequest = asyncHandler(async (req, res) => {
  const request = await InterpreterRequest.findOneAndUpdate(
    { _id: objectId(req.params.id, 'id'), interpreter: req.user._id, status: { $in: ['accepted', 'in_progress'] } },
    { status: 'completed', completedAt: new Date() },
    { new: true }
  );
  if (!request) throw new ApiError(404, 'Request not found', 'NOT_FOUND');
  req.app.get('io')?.to(request.roomId).emit('interpreter-request-updated', { id: request._id, status: request.status });
  res.json({ request });
});

// Used so the call UI can show whether an interpreter has already been requested for this room
export const roomStatus = asyncHandler(async (req, res) => {
  const roomId = str(req.params.roomId, 'roomId', { max: 100 });
  const access = await getRoomAccess(req.user, roomId);
  if (!access) throw new ApiError(403, 'No access to this room', 'FORBIDDEN');
  const requests = await InterpreterRequest.find({ roomId }).populate(populate).sort({ createdAt: -1 });
  res.json({ requests });
});
