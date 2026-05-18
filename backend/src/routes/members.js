const express = require('express');
const {
  getFamilyMembers,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
} = require('../controllers/labController');
const { protect, requireRole } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { familyMemberValidator, mongoIdParamValidator } = require('../validators/labValidator');

const router = express.Router();

router.use(protect, requireRole('patient'));
router.get('/', getFamilyMembers);
router.post('/', familyMemberValidator, validateRequest, addFamilyMember);
router.put('/:id', mongoIdParamValidator, familyMemberValidator, validateRequest, updateFamilyMember);
router.delete('/:id', mongoIdParamValidator, validateRequest, deleteFamilyMember);

module.exports = router;
