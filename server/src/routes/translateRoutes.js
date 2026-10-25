import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { protect } from '../middleware/auth.js';
import { translate } from '../controllers/translateController.js';

const limiter = rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: true, legacyHeaders: false });
const r = Router();
r.post('/', protect, limiter, translate);
export default r;
