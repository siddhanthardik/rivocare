const express = require('express');
const { getLabs, getLabById, searchTests, bookTest, getMyOrders, getInvoice } = require('../controllers/labController');
const { protect } = require('../middleware/auth'); // assuming patient auth uses standard protect

const router = express.Router();

router.get('/', getLabs);
router.get('/tests', searchTests);
router.get('/:id', getLabById);

// Protected patient routes
router.use(protect);
router.post('/book', bookTest);
router.get('/me/orders', getMyOrders);
router.get('/me/orders/:id/invoice', getInvoice);

// Profiles & Retention
const { 
  getFamilyMembers, addFamilyMember, 
  getSavedAddresses, addSavedAddress 
} = require('../controllers/labController');

router.get('/me/family', getFamilyMembers);
router.post('/me/family', addFamilyMember);
router.get('/me/addresses', getSavedAddresses);
router.post('/me/addresses', addSavedAddress);

module.exports = router;
