const express = require('express');
const router = express.Router();
const ErrorLog = require('../models/ErrorLog');

// @desc    Log frontend error
// @route   POST /api/logs/frontend-error
// @access  Public (so it works even if user isn't logged in, or use optional auth)
router.post('/frontend-error', async (req, res) => {
  try {
    const { message, stack, route, component, user, browser } = req.body;
    
    // Log to console in dev
    if (process.env.NODE_ENV === 'development') {
      console.error(`[FRONTEND_ERROR] ${message} at ${route}`);
    }

    await ErrorLog.create({
      message,
      stack,
      route,
      component,
      user,
      browser,
      timestamp: new Date()
    });

    res.status(201).json({ success: true });
  } catch (err) {
    console.error('[LOGGER_ERROR]', err.message);
    res.status(500).json({ success: false });
  }
});

// @desc    Get all error logs (Admin only)
// @route   GET /api/logs/errors
// @access  Private/Admin
const { protect, requireRole } = require('../middleware/auth');
router.get('/errors', protect, requireRole('admin'), async (req, res) => {
  try {
    const logs = await ErrorLog.find().sort({ timestamp: -1 }).limit(100);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
