import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id, read: false };
  const [notifications, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(30),
    Notification.countDocuments(filter),
  ]);
  res.json({ notifications, unread });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ ok: true });
});
