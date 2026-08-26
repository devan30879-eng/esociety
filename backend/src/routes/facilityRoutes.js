const express = require('express');
const router = express.Router();
const {
  createFacility, getFacilities, getFacilityById, updateFacility,
  deleteFacility, bookFacility, getFacilityBookings,
  getMyBookings, cancelBooking, getAllBookings,
} = require('../controllers/facilityController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Booking-specific routes (before /:id to avoid conflicts)
router.get('/bookings/my', getMyBookings);
router.get('/bookings/all', authorize('admin'), getAllBookings);
router.put('/bookings/:bookingId/cancel', cancelBooking);

// Facility CRUD
router.get('/', getFacilities);
router.post('/', authorize('admin'), createFacility);
router.get('/:id', getFacilityById);
router.put('/:id', authorize('admin'), updateFacility);
router.delete('/:id', authorize('admin'), deleteFacility);

// Booking a specific facility
router.post('/:id/book', authorize('resident', 'admin'), bookFacility);
router.get('/:id/bookings', getFacilityBookings);

module.exports = router;
