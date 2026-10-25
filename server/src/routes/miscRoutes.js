import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { listLanguages } from '../controllers/translateController.js';
import { getTranscript } from '../controllers/consultationController.js';
import { listNotifications, markAllRead } from '../controllers/notificationController.js';
import { listClinicians, listUsers, createUser, updateUser } from '../controllers/userController.js';
import {
  listGlossary, createGlossary, updateGlossary, deleteGlossary,
  listAllLanguages, createLanguage, updateLanguage,
} from '../controllers/adminController.js';

export const languageRoutes = Router();
languageRoutes.get('/', listLanguages);

export const consultationRoutes = Router();
consultationRoutes.get('/:roomId/transcript', protect, getTranscript);

export const notificationRoutes = Router();
notificationRoutes.use(protect);
notificationRoutes.get('/', listNotifications);
notificationRoutes.patch('/read-all', markAllRead);

export const userRoutes = Router();
userRoutes.use(protect);
userRoutes.get('/clinicians', listClinicians);

export const adminRoutes = Router();
adminRoutes.use(protect, authorize('admin'));
adminRoutes.get('/users', listUsers);
adminRoutes.post('/users', createUser);
adminRoutes.patch('/users/:id', updateUser);
adminRoutes.get('/glossary', listGlossary);
adminRoutes.post('/glossary', createGlossary);
adminRoutes.patch('/glossary/:id', updateGlossary);
adminRoutes.delete('/glossary/:id', deleteGlossary);
adminRoutes.get('/languages', listAllLanguages);
adminRoutes.post('/languages', createLanguage);
adminRoutes.patch('/languages/:id', updateLanguage);
