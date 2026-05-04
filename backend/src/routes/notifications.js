const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getUserNotifications, markAsRead, markAllAsRead } = require('../services/notificationService');

router.use(authenticate);

// ─── Get my notifications ────────────────────────────────────────────────────

router.get('/', async (req, res, next) => {
  const { page, limit } = req.query;
  try {
    const result = await getUserNotifications(req.user.id, req.user.role, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
    res.json(result);
  } catch (err) { next(err); }
});

// ─── Get unread count ────────────────────────────────────────────────────────

router.get('/unread-count', async (req, res, next) => {
  try {
    const result = await getUserNotifications(req.user.id, req.user.role, { page: 1, limit: 1 });
    res.json({ unreadCount: result.unreadCount });
  } catch (err) { next(err); }
});

// ─── Mark single notification as read ────────────────────────────────────────

router.patch('/:id/read', async (req, res, next) => {
  try {
    const notification = await markAsRead(req.params.id, req.user.id, req.user.role);
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json(notification);
  } catch (err) { next(err); }
});

// ─── Mark all as read ────────────────────────────────────────────────────────

router.patch('/read-all', async (req, res, next) => {
  try {
    const result = await markAllAsRead(req.user.id, req.user.role);
    res.json({ message: `${result.count} notifications marked as read` });
  } catch (err) { next(err); }
});

module.exports = router;
