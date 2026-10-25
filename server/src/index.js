import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server } from 'socket.io';

import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { notFound, errorHandler } from './middleware/error.js';
import { registerSockets } from './sockets/index.js';
import authRoutes from './routes/authRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import translateRoutes from './routes/translateRoutes.js';
import interpreterRoutes from './routes/interpreterRoutes.js';
import { languageRoutes, consultationRoutes, notificationRoutes, userRoutes, adminRoutes } from './routes/miscRoutes.js';

// Safety net: log stray async errors instead of letting one of them kill every live consultation
process.on('unhandledRejection', (reason) => console.error('Unhandled rejection:', reason));

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: env.clientOrigins, credentials: true } });
app.set('io', io);

app.use(helmet({ contentSecurityPolicy: false })); // CSP off so the bundled React app + WebRTC work out of the box
app.use(cors({ origin: env.clientOrigins }));
app.use(express.json({ limit: '100kb' }));
if (env.nodeEnv !== 'test') app.use(morgan('dev'));

app.get('/api/health', (_req, res) => res.json({ ok: true, provider: env.translation.provider }));
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/interpreters', interpreterRoutes);
app.use('/api/languages', languageRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// In production serve the built React app from the same server (one deployment)
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api|socket\.io).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use(notFound);
app.use(errorHandler);
registerSockets(io);

try {
  await connectDB();
} catch (err) {
  console.error(`\nCould not connect to MongoDB (${err.message}).\nCheck MONGODB_URI in server/.env and that MongoDB is running / your Atlas IP allow-list includes this machine.\n`);
  process.exit(1);
}
server.listen(env.port, () => console.log(`Server listening on http://localhost:${env.port} (translation: ${env.translation.provider})`));
