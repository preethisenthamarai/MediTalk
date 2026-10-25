import Notification from '../models/Notification.js';

export async function notify(io, userId, type, data = {}) {
  const n = await Notification.create({ user: userId, type, data });
  io?.to(`user:${userId}`).emit('notification', n);
  return n;
}
