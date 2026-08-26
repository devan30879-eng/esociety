const mongoose = require('mongoose');

/**
 * Emergency Schema - Tracks emergency alerts raised by residents/security
 */
const emergencySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Emergency title is required'],
    },
    description: {
      type: String,
      required: [true, 'Emergency description is required'],
    },
    type: {
      type: String,
      enum: ['fire', 'medical', 'security_breach', 'flood', 'gas_leak', 'theft', 'other'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'high',
    },
    // Who raised the alert
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    location: {
      type: String, // e.g. "Block A, Floor 3"
    },
    status: {
      type: String,
      enum: ['active', 'responding', 'resolved'],
      default: 'active',
    },
    // Who resolved the emergency
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
    resolutionNote: {
      type: String,
    },
    // List of users notified
    notifiedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Emergency contact numbers dialed
    contactsNotified: [String],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Emergency', emergencySchema);
