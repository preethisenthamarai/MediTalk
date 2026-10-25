import { ApiError } from '../utils/ApiError.js';

export const notFound = (req, _res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'));

// Centralised error handling
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = err.status || 500;
  let message = err.message || 'Server error';
  let code = err.code;

  if (err.name === 'ValidationError') {
    status = 400;
    code = 'VALIDATION';
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.name === 'CastError') {
    status = 400;
    code = 'VALIDATION';
    message = `Invalid ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    code = 'DUPLICATE';
    message = `${Object.keys(err.keyPattern || {})[0] || 'Value'} already exists`;
  }

  if (status >= 500) console.error(err);
  res.status(status).json({ message: status >= 500 && process.env.NODE_ENV === 'production' ? 'Server error' : message, code, ...(err.extra || {}) });
}
