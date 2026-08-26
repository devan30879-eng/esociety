const mongoose = require('mongoose');

/**
 * Complaint Schema - Tracks resident complaints and their resolution
 */
const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Complaint description is required'],
    },
    category: {
      type: String,
      required: true,
      enum: [
        'plumbing',
        'electrical',
        'cleaning',
        'security',
        'parking',
        'noise',
        'internet',
        'lift',
        'other',
      ],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved', 'closed', 'rejected'],
      default: 'open',
    },
    // Resident who raised the complaint
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Staff/admin assigned to resolve
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Images attached to complaint
    attachments: [
      {
        type: String, // URL to image
      },
    ],
    // Log of status changes with timestamps
    statusHistory: [
      {
        status: String,
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        note: String,
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Admin/staff response notes
    resolutionNote: {
      type: String,
    },
    resolvedAt: {
      type: Date,
    },
    // Resident rating after resolution
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    flatNumber: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Complaint', complaintSchema);
