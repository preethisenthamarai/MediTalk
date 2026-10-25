import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAccess } from '../utils/tokens.js';

export async function userFromToken(token) {
  let payload;
  try {
    payload = verifyAccess(token);
  } catch (err) {
    const expired = err.name === 'TokenExpiredError';
    throw new ApiError(401, expired ? 'Token expired' : 'Invalid token', expired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN');
  }
  const user = await User.findById(payload.sub);
  if (!user || !user.active || user.approved === false) throw new ApiError(401, 'User not found or disabled', 'INVALID_TOKEN');
  return user;
}

export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Not authenticated', 'NO_TOKEN');
  req.user = await userFromToken(token);
  next();
});

// Role-based access control
export const authorize =
  (...roles) =>
  (req, _res, next) =>
    roles.includes(req.user.role) ? next() : next(new ApiError(403, 'You do not have permission to do that', 'FORBIDDEN'));
