const Facility = require('../models/Facility');
const Booking = require('../models/Booking');
const asyncHandler = require('../middleware/asyncHandler');

// ===== FACILITY CRUD =====

/**
 * @route  POST /api/facilities
 * @desc   Create a new facility (admin only)
 * @access Private/Admin
 */
const createFacility = asyncHandler(async (req, res) => {
  const facility = await Facility.create(req.body);
  res.status(201).json({ success: true, message: 'Facility created', facility });
});

/**
 * @route  GET /api/facilities
 * @desc   Get all active facilities
 * @access Private
 */
const getFacilities = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.type) filter.type = req.query.type;

  const facilities = await Facility.find(filter).sort({ name: 1 });
  res.json({ success: true, count: facilities.length, facilities });
});

/**
 * @route  GET /api/facilities/:id
 * @desc   Get facility details with availability
 * @access Private
 */
const getFacilityById = asyncHandler(async (req, res) => {
  const facility = await Facility.findById(req.params.id);
  if (!facility) {
    return res.status(404).json({ success: false, message: 'Facility not found' });
  }
  res.json({ success: true, facility });
});

/**
 * @route  PUT /api/facilities/:id
 * @desc   Update facility details
 * @access Private/Admin
 */
const updateFacility = asyncHandler(async (req, res) => {
  const facility = await Facility.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!facility) {
    return res.status(404).json({ success: false, message: 'Facility not found' });
  }

  res.json({ success: true, message: 'Facility updated', facility });
});

/**
 * @route  DELETE /api/facilities/:id
 * @desc   Deactivate a facility
 * @access Private/Admin
 */
const deleteFacility = asyncHandler(async (req, res) => {
  const facility = await Facility.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!facility) {
    return res.status(404).json({ success: false, message: 'Facility not found' });
  }

  res.json({ success: true, message: 'Facility deactivated' });
});

// ===== BOOKING OPERATIONS =====

/**
 * @route  POST /api/facilities/:id/book
 * @desc   Book a facility for a specific time slot
 * @access Private/Resident
 */
const bookFacility = asyncHandler(async (req, res) => {
  const { date, startTime, endTime, attendees, purpose } = req.body;
  const facilityId = req.params.id;

  const facility = await Facility.findById(facilityId);
  if (!facility || !facility.isActive) {
    return res.status(404).json({ success: false, message: 'Facility not found' });
  }

  // Check if the requested slot conflicts with existing bookings
  const bookingDate = new Date(date);
  const conflictingBooking = await Booking.findOne({
    facility: facilityId,
    date: bookingDate,
    status: { $in: ['pending', 'confirmed'] },
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } }, // Overlap check
    ],
  });

  if (conflictingBooking) {
    return res
      .status(400)
      .json({ success: false, message: 'Time slot already booked. Please choose another.' });
  }

  // Calculate duration and total cost
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const duration = (eh * 60 + em - (sh * 60 + sm)) / 60;
  const totalAmount = duration * facility.pricePerHour;

  const booking = await Booking.create({
    facility: facilityId,
    bookedBy: req.user._id,
    date: bookingDate,
    startTime,
    endTime,
    duration,
    totalAmount,
    attendees,
    purpose,
    paymentStatus: totalAmount === 0 ? 'waived' : 'pending',
  });

  res.status(201).json({
    success: true,
    message: 'Facility booked successfully',
    booking,
    totalAmount,
  });
});

/**
 * @route  GET /api/facilities/:id/bookings
 * @desc   Get all bookings for a specific facility on a given date
 * @access Private
 */
const getFacilityBookings = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const filter = { facility: req.params.id };

  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    filter.date = { $gte: start, $lte: end };
    filter.status = { $in: ['pending', 'confirmed'] };
  }

  const bookings = await Booking.find(filter)
    .populate('bookedBy', 'name flatNumber block')
    .sort({ startTime: 1 });

  res.json({ success: true, bookings });
});

/**
 * @route  GET /api/facilities/bookings/my
 * @desc   Get logged-in resident's bookings
 * @access Private/Resident
 */
const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ bookedBy: req.user._id })
    .populate('facility', 'name type image')
    .sort({ date: -1 });

  res.json({ success: true, count: bookings.length, bookings });
});

/**
 * @route  PUT /api/facilities/bookings/:bookingId/cancel
 * @desc   Cancel a booking
 * @access Private
 */
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  // Only the booker or admin can cancel
  if (
    booking.bookedBy.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
  }

  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  booking.cancelledBy = req.user._id;
  booking.notes = req.body.reason || 'Cancelled by user';
  await booking.save();

  res.json({ success: true, message: 'Booking cancelled', booking });
});

/**
 * @route  GET /api/facilities/bookings/all
 * @desc   Get all bookings (admin)
 * @access Private/Admin
 */
const getAllBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find()
    .populate('facility', 'name type')
    .populate('bookedBy', 'name flatNumber')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: bookings.length, bookings });
});

module.exports = {
  createFacility,
  getFacilities,
  getFacilityById,
  updateFacility,
  deleteFacility,
  bookFacility,
  getFacilityBookings,
  getMyBookings,
  cancelBooking,
  getAllBookings,
};
