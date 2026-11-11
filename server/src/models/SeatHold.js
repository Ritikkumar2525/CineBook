const mongoose = require('mongoose');

const seatHoldSchema = new mongoose.Schema(
  {
    showtime: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Showtime',
      required: [true, 'Showtime reference is required'],
      index: true,
    },
    seatId: {
      type: String,
      required: [true, 'Seat ID is required'],
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['held', 'booked', 'released', 'expired'],
      default: 'held',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration time is required'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index so the same seat in the same showtime cannot be simultaneously held or booked
seatHoldSchema.index(
  { showtime: 1, seatId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['held', 'booked'] } },
  }
);

seatHoldSchema.index({ showtime: 1, status: 1 });

const SeatHold = mongoose.models.SeatHold || mongoose.model('SeatHold', seatHoldSchema);

module.exports = SeatHold;
