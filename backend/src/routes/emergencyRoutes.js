const express = require('express');
const router = express.Router();
const {
  raiseEmergency, getEmergencies, resolveEmergency, getEmergencyContacts,
} = require('../controllers/emergencyController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/contacts', getEmergencyContacts);
router.get('/', getEmergencies);
router.post('/', raiseEmergency); // Any logged-in user can raise emergency
router.put('/:id/resolve', authorize('admin', 'security'), resolveEmergency);

module.exports = router;
