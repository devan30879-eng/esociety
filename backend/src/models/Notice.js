const mongoose = require('mongoose');

/**
 * Notice Schema - Community bulletin board notices, events, polls
 */
const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Notice title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Notice content is required'],
    },
    type: {
      type: String,
      enum: ['notice', 'event', 'poll', 'emergency', 'maintenance_alert'],
      default: 'notice',
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    // Admin who posted the notice
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Target audience
    targetRole: {
      type: String,
      enum: ['all', 'resident', 'security', 'admin'],
      default: 'all',
    },
    // Event specific fields
    eventDate: {
      type: Date,
    },
    eventVenue: {
      type: String,
    },
    // Attachments/images
    attachments: [String],
    // Poll options and votes
    pollOptions: [
      {
        option: String,
        votes: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
        ],
      },
    ],
    // Track who has read the notice
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notice', noticeSchema);
