const mongoose = require('mongoose');

const showtimeSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Movie reference is required'],
      index: true,
    },
    screen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Screen',
      required: [true, 'Screen reference is required'],
      index: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Showtime start time is required'],
      index: true,
    },
    endTime: {
      type: Date,
      required: [true, 'Showtime end time is required'],
    },
    status: {
      type: String,
      enum: ['scheduled', 'cancelled', 'completed'],
      default: 'scheduled',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

showtimeSchema.index({ movie: 1, startTime: 1 });
showtimeSchema.index({ screen: 1, startTime: 1, endTime: 1 });

const Showtime = mongoose.models.Showtime || mongoose.model('Showtime', showtimeSchema);

module.exports = Showtime;
