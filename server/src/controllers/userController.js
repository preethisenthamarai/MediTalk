import User, { ROLES } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { str, email, password, oneOf, objectId } from '../utils/validate.js';

// GET /api/users/clinicians  (any logged-in user; needed for booking)
export const listClinicians = asyncHandler(async (_req, res) => {
  const clinicians = await User.find({ role: 'clinician', active: true, approved: { $ne: false } }).select('name preferredLanguage spokenLanguages specialty').sort({ name: 1 });
  res.json({ clinicians });
});

// ---- admin only below ----
export const listUsers = asyncHandler(async (_req, res) => {
  res.json({ users: await User.find().sort({ createdAt: -1 }).limit(500) });
});

export const createUser = asyncHandler(async (req, res) => {
  const user = await User.create({
    name: str(req.body.name, 'name', { max: 100 }),
    email: email(req.body.email),
    password: password(req.body.password),
    role: oneOf(req.body.role, 'role', ROLES),
    preferredLanguage: str(req.body.preferredLanguage, 'preferredLanguage', { max: 10, required: false }) || 'en',
    spokenLanguages: Array.isArray(req.body.spokenLanguages) ? req.body.spokenLanguages.map(String).slice(0, 20) : [],
    specialty: str(req.body.specialty, 'specialty', { max: 100, required: false }),
  });
  res.status(201).json({ user });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(objectId(req.params.id, 'id'));
  if (!user) throw new ApiError(404, 'User not found', 'NOT_FOUND');
  if (req.body.role !== undefined) user.role = oneOf(req.body.role, 'role', ROLES);
  if (req.body.active !== undefined) {
    if (String(user._id) === String(req.user._id) && !req.body.active) throw new ApiError(400, 'You cannot disable yourself', 'BAD_STATE');
    user.active = !!req.body.active;
  }
  if (req.body.approved !== undefined) user.approved = !!req.body.approved;
  if (Array.isArray(req.body.spokenLanguages)) user.spokenLanguages = req.body.spokenLanguages.map(String).slice(0, 20);
  await user.save();
  res.json({ user });
});
