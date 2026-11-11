const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    genre: {
      type: [String],
      required: [true, 'At least one genre is required'],
    },
    duration: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      min: [1, 'Duration must be at least 1 minute'],
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      trim: true,
    },
    format: {
      type: String,
      enum: ['2D', '3D', 'IMAX', '4DX'],
      default: '2D',
    },
    posterUrl: {
      type: String,
      trim: true,
    },
    rating: {
      type: String,
      enum: ['U', 'UA', 'A', 'S'],
    },
    releaseDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['now_showing', 'coming_soon', 'ended'],
      default: 'coming_soon',
    },
  },
  {
    timestamps: true,
  }
);

movieSchema.index({ title: 'text', language: 1, status: 1 });

const Movie = mongoose.models.Movie || mongoose.model('Movie', movieSchema);

module.exports = Movie;
