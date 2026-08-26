const mongoose = require('mongoose');

/**
 * Payment Schema - Tracks maintenance dues, invoices & receipts
 */
const paymentSchema = new mongoose.Schema(
  {
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['maintenance', 'facility_booking', 'penalty', 'other'],
      required: true,
    },
    // Month/Year for maintenance (e.g. "2024-01")
    billingPeriod: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    // Late payment penalty
    penalty: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'partial', 'waived'],
      default: 'pending',
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paidAt: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'card', 'bank_transfer', 'cheque'],
    },
    // Unique invoice/receipt number
    invoiceNumber: {
      type: String,
      unique: true,
    },
    // Reference to facility booking if applicable
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    // Who recorded/confirmed the payment
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    description: {
      type: String,
    },
    receiptUrl: {
      type: String, // URL to generated PDF receipt
    },
    flatNumber: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save hook: Auto-generate invoice number
 */
paymentSchema.pre('save', function (next) {
  if (!this.invoiceNumber) {
    // Format: INV-YYYYMMDD-RANDOM4DIGITS
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.invoiceNumber = `INV-${date}-${rand}`;
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
