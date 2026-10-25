import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, registerDoctor, login, refresh, me, updateMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const limiter = rateLimit({ windowMs: 15 * 60_000, limit: 50, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many attempts, try again later', code: 'RATE_LIMIT' } });

const r = Router();
r.post('/register', limiter, register);
r.post('/register-doctor', limiter, registerDoctor);
r.post('/login', limiter, login);
r.post('/refresh', refresh);
r.get('/me', protect, me);
r.patch('/me', protect, updateMe);
export default r;
