const express = require('express');
const { getReport } = require('../controllers/labController');
const { protect, requireRole } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { mongoIdParamValidator } = require('../validators/labValidator');

const router = express.Router();

router.use(protect, requireRole('patient'));
router.get('/:id', mongoIdParamValidator, validateRequest, getReport);

module.exports = router;
