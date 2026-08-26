const mongoose = require('mongoose');

/**
 * Facility Schema - Defines bookable amenities in the society
 */
const facilitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Facility name is required'],
      trim: true,
    },
    description: {
      type: String,
    },
    type: {
      type: String,
      enum: [
        'gymnasium',
        'swimming_pool',
        'clubhouse',
        'sports_court',
        'party_hall',
        'terrace',
        'other',
      ],
      required: true,
    },
    // Booking cost per hour (0 = free)
    pricePerHour: {
      type: Number,
      default: 0,
    },
    // Capacity in persons
    capacity: {
      type: Number,
      required: true,
    },
    // Operating hours
    openTime: {
      type: String, // "06:00"
      required: true,
    },
    closeTime: {
      type: String, // "22:00"
      required: true,
    },
    // Days available (0=Sunday ... 6=Saturday)
    availableDays: {
      type: [Number],
      default: [0, 1, 2, 3, 4, 5, 6],
    },
    image: {
      type: String, // URL to facility image
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    amenities: [String], // e.g. ["AC", "WiFi", "Projector"]
    rules: [String], // e.g. ["No smoking", "Clean after use"]
    maintenanceSchedule: [
      {
        day: String,
        startTime: String,
        endTime: String,
        note: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Facility', facilitySchema);
