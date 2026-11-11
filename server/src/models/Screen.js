const mongoose = require('mongoose');

const seatCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    rows: {
      type: [String],
      required: true,
    },
    seatsPerRow: {
      type: Number,
      required: true,
      min: 1,
    },
    color: {
      type: String,
      default: '#3b82f6',
    },
  },
  { _id: false }
);

const screenSchema = new mongoose.Schema(
  {
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: [true, 'Theatre reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Screen name is required'],
      trim: true,
    },
    screenType: {
      type: String,
      enum: ['Standard', 'Premium', 'IMAX', '4DX'],
      default: 'Standard',
    },
    seatCategories: {
      type: [seatCategorySchema],
      default: [],
    },
    totalSeats: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Method / virtual to compute total seats from seat categories
screenSchema.virtual('computedTotalSeats').get(function () {
  if (!this.seatCategories || this.seatCategories.length === 0) return 0;
  return this.seatCategories.reduce((total, cat) => {
    const rowCount = Array.isArray(cat.rows) ? cat.rows.length : 0;
    const seatsPerRow = cat.seatsPerRow || 0;
    return total + rowCount * seatsPerRow;
  }, 0);
});

// Pre-save hook to ensure totalSeats is always up to date
screenSchema.pre('save', function (next) {
  if (this.seatCategories && this.seatCategories.length > 0) {
    this.totalSeats = this.seatCategories.reduce((total, cat) => {
      const rowCount = Array.isArray(cat.rows) ? cat.rows.length : 0;
      const seatsPerRow = cat.seatsPerRow || 0;
      return total + rowCount * seatsPerRow;
    }, 0);
  }
  next();
});

const Screen = mongoose.models.Screen || mongoose.model('Screen', screenSchema);

module.exports = Screen;
