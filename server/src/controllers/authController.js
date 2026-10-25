import User from '../models/User.js';
import Language from '../models/Language.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signTokens, verifyRefresh } from '../utils/tokens.js';
import { str, email, password } from '../utils/validate.js';

// Which login page each role belongs to
const PORTAL_OF = { patient: 'patient', clinician: 'doctor', interpreter: 'staff', admin: 'staff' };

async function assertLanguage(code) {
  const ok = await Language.exists({ code, enabled: true });
  if (!ok) throw new ApiError(400, `Language "${code}" is not supported`, 'VALIDATION');
}

// POST /api/auth/register  (public sign-up is always a patient; staff are created by an admin)
export const register = asyncHandler(async (req, res) => {
  const name = str(req.body.name, 'name', { max: 100 });
  const mail = email(req.body.email);
  const pass = password(req.body.password);
  const preferredLanguage = str(req.body.preferredLanguage, 'preferredLanguage', { max: 10, required: false }) || 'en';
  await assertLanguage(preferredLanguage);

  const user = await User.create({ name, email: mail, password: pass, preferredLanguage, role: 'patient' });
  res.status(201).json({ user, ...signTokens(user) });
});

// POST /api/auth/register-doctor  (creates a clinician who must be approved by an admin before signing in)
export const registerDoctor = asyncHandler(async (req, res) => {
  const spoken = Array.isArray(req.body.spokenLanguages) ? req.body.spokenLanguages.map(String).slice(0, 10) : [];
  const preferredLanguage = str(req.body.preferredLanguage, 'preferredLanguage', { max: 10, required: false }) || 'en';
  await assertLanguage(preferredLanguage);
  await User.create({
    name: str(req.body.name, 'name', { max: 100 }),
    email: email(req.body.email),
    password: password(req.body.password),
    role: 'clinician',
    preferredLanguage,
    spokenLanguages: spoken.length ? spoken : [preferredLanguage],
    specialty: str(req.body.specialty, 'specialty', { max: 100 }),
    licenseNumber: str(req.body.licenseNumber, 'licenseNumber', { max: 50 }),
    approved: false,
  });
  res.status(201).json({ pending: true });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const mail = email(req.body.email);
  const pass = str(req.body.password, 'password', { max: 128 });
  const user = await User.findOne({ email: mail }).select('+password');
  if (!user || !(await user.comparePassword(pass))) throw new ApiError(401, 'Invalid email or password', 'BAD_CREDENTIALS');
  if (!user.active) throw new ApiError(403, 'Account disabled', 'DISABLED');
  if (user.approved === false) throw new ApiError(403, 'Your account is waiting for admin approval', 'PENDING_APPROVAL');

  // Optional: the login page tells us which portal it is (patient / doctor / staff).
  // A doctor cannot sign in through the patient page and vice versa.
  const portal = req.body.portal;
  if (portal && PORTAL_OF[user.role] !== portal) {
    throw new ApiError(403, `This is a ${PORTAL_OF[user.role]} account. Please use the ${PORTAL_OF[user.role]} login.`, 'WRONG_PORTAL', { accountPortal: PORTAL_OF[user.role] });
  }
  res.json({ user, ...signTokens(user) });
});

// POST /api/auth/refresh  -> new access + refresh token (refresh-token flow for expired JWTs)
export const refresh = asyncHandler(async (req, res) => {
  const token = str(req.body.refreshToken, 'refreshToken', { max: 2000 });
  let payload;
  try {
    payload = verifyRefresh(token);
  } catch {
    throw new ApiError(401, 'Session expired, please log in again', 'REFRESH_EXPIRED');
  }
  const user = await User.findById(payload.sub);
  if (!user || !user.active || user.approved === false) throw new ApiError(401, 'Session expired, please log in again', 'REFRESH_EXPIRED');
  res.json({ user, ...signTokens(user) });
});

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => res.json({ user: req.user }));

// PATCH /api/auth/me
export const updateMe = asyncHandler(async (req, res) => {
  const name = str(req.body.name, 'name', { max: 100, required: false });
  const lang = str(req.body.preferredLanguage, 'preferredLanguage', { max: 10, required: false });
  if (lang) {
    await assertLanguage(lang);
    req.user.preferredLanguage = lang;
  }
  if (name) req.user.name = name;
  await req.user.save();
  res.json({ user: req.user });
});
