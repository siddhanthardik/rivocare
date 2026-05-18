const express = require('express');
const { getInvoice } = require('../controllers/labController');
const { protect, requireRole } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { mongoIdParamValidator } = require('../validators/labValidator');

const router = express.Router();

const Partner = require('../models/Partner');
const jwt = require('jsonwebtoken');

// General protect for patient-only invoice fetch
router.get('/:id', protect, mongoIdParamValidator, validateRequest, requireRole('patient'), getInvoice);

// Custom middleware: allow either patient or partner token
const anyProtect = async (req, res, next) => {
	try {
		let token;
		if (req.headers.authorization?.startsWith('Bearer ')) token = req.headers.authorization.split(' ')[1];
		if (!token) return res.status(401).json({ success: false, message: 'Not authorized — no token' });
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const User = require('../models/User');
		const user = await User.findById(decoded.id);
		if (user) { req.user = user; return next(); }
		const partner = await Partner.findById(decoded.id);
		if (partner) { req.partner = partner; return next(); }
		return res.status(401).json({ success: false, message: 'Not authorized' });
	} catch (err) {
		return res.status(401).json({ success: false, message: 'Invalid token' });
	}
};

const { downloadInvoice } = require('../controllers/labController');
router.get('/:id/download', anyProtect, mongoIdParamValidator, validateRequest, downloadInvoice);

module.exports = router;
