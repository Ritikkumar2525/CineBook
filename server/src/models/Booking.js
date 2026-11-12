const mongoose = require('mongoose');

const bookingSeatSchema = new mongoose.Schema(
  {
    seatId: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const mealOrderSchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, max: 10 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    showtime: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Showtime',
      required: [true, 'Showtime reference is required'],
      index: true,
    },
    seats: {
      type: [bookingSeatSchema],
      required: [true, 'At least one seat is required'],
      validate: [
        (val) => Array.isArray(val) && val.length > 0,
        'Booking must contain at least one seat',
      ],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    bookingRef: {
      type: String,
      required: [true, 'Booking reference is required'],
      unique: true,
      trim: true,
      index: true,
    },
    qrCode: {
      type: String, // Base64 data URL
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'used'],
      default: 'confirmed',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'refunded'],
      default: 'completed',
    },
    mealOrders: {
      type: [mealOrderSchema],
      default: [],
    },
    mealTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    bookedForOther: {
      type: Boolean,
      default: false,
    },
    recipient: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true },
      message: { type: String, trim: true },
    },
    cancelledAt: {
      type: Date,
    },
    usedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ createdAt: -1 });

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

module.exports = Booking;
