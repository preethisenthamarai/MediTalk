import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signTokens(user) {
  const payload = { sub: String(user._id), role: user.role };
  return {
    accessToken: jwt.sign(payload, env.jwtSecret, { expiresIn: env.accessExpires }),
    refreshToken: jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.refreshExpires }),
  };
}

export const verifyAccess = (token) => jwt.verify(token, env.jwtSecret);
export const verifyRefresh = (token) => jwt.verify(token, env.jwtRefreshSecret);
