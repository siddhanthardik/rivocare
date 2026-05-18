const express = require('express');
const { download } = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/:id/download', download);

module.exports = router;
