import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { requestInterpreter, listPending, acceptRequest, completeRequest, roomStatus } from '../controllers/interpreterController.js';

const r = Router();
r.use(protect);
r.post('/request', authorize('patient', 'clinician', 'admin'), requestInterpreter);
r.get('/pending', authorize('interpreter', 'admin'), listPending);
r.get('/room/:roomId', roomStatus);
r.post('/:id/accept', authorize('interpreter'), acceptRequest);
r.post('/:id/complete', authorize('interpreter'), completeRequest);
export default r;
