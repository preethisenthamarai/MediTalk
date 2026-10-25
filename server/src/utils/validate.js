import { ApiError } from './ApiError.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function str(value, field, { min = 1, max = 500, required = true } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new ApiError(400, `${field} is required`, 'VALIDATION');
    return undefined;
  }
  if (typeof value !== 'string') throw new ApiError(400, `${field} must be a string`, 'VALIDATION');
  const v = value.trim();
  if (v.length < min || v.length > max) {
    throw new ApiError(400, `${field} must be between ${min} and ${max} characters`, 'VALIDATION');
  }
  return v;
}

export function email(value) {
  const v = str(value, 'email', { max: 254 }).toLowerCase();
  if (!EMAIL_RE.test(v)) throw new ApiError(400, 'Invalid email address', 'VALIDATION');
  return v;
}

export function password(value) {
  return str(value, 'password', { min: 8, max: 128 });
}

export function oneOf(value, field, allowed, { required = true } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new ApiError(400, `${field} is required`, 'VALIDATION');
    return undefined;
  }
  if (!allowed.includes(value)) throw new ApiError(400, `${field} must be one of: ${allowed.join(', ')}`, 'VALIDATION');
  return value;
}

export function objectId(value, field) {
  if (typeof value !== 'string' || !/^[a-f\d]{24}$/i.test(value)) {
    throw new ApiError(400, `${field} is not a valid id`, 'VALIDATION');
  }
  return value;
}
