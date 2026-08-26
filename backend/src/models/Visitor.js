const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

/**
 * Visitor Schema - Tracks all visitors entering the society
 * Includes QR code / OTP based entry system
 */
const visitorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Visitor name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Visitor phone is required'],
    },
    purpose: {
      type: String,
      required: [true, 'Purpose of visit is required'],
      enum: ['guest', 'delivery', 'maintenance', 'cab', 'other'],
    },
    vehicleNumber: {
      type: String,
      trim: true,
    },
    photo: {
      type: String, // URL to visitor photo
    },
    // The resident being visited
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Security guard who logged the entry
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied', 'inside', 'exited'],
      default: 'pending',
    },
    // OTP for verification (6-digit)
    otp: {
      code: String,
      expiresAt: Date,
    },
    // QR code data string
    qrCode: {
      type: String,
      default: () => uuidv4(), // Unique QR token
    },
    entryTime: {
      type: Date,
    },
    exitTime: {
      type: Date,
    },
    expectedArrival: {
      type: Date,
    },
    notes: {
      type: String,
    },
    // Pre-approved by resident before arrival
    preApproved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Visitor', visitorSchema);
