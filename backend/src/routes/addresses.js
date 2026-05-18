const express = require('express');
const {
  getSavedAddresses,
  addSavedAddress,
  updateSavedAddress,
  deleteSavedAddress,
} = require('../controllers/labController');
const { protect, requireRole } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { savedAddressValidator, mongoIdParamValidator } = require('../validators/labValidator');

const router = express.Router();

router.use(protect, requireRole('patient'));
router.get('/', getSavedAddresses);
router.post('/', savedAddressValidator, validateRequest, addSavedAddress);
router.put('/:id', mongoIdParamValidator, savedAddressValidator, validateRequest, updateSavedAddress);
router.delete('/:id', mongoIdParamValidator, validateRequest, deleteSavedAddress);

module.exports = router;
