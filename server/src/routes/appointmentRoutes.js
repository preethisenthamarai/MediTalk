import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { createAppointment, listAppointments, getAppointment, cancelAppointment, completeAppointment } from '../controllers/appointmentController.js';

const r = Router();
r.use(protect);
r.post('/', authorize('patient'), createAppointment);
r.get('/', listAppointments);
r.get('/:id', getAppointment);
r.patch('/:id/cancel', cancelAppointment);
r.patch('/:id/complete', authorize('clinician', 'admin'), completeAppointment);
export default r;
