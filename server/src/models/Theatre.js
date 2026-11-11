const mongoose = require('mongoose');

const theatreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Theatre name is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Theatre location is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    facilities: {
      type: [String],
      default: ['Parking', 'Food Court', 'Wheelchair Access'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

theatreSchema.virtual('screens', {
  ref: 'Screen',
  localField: '_id',
  foreignField: 'theatre',
});

theatreSchema.index({ city: 1, name: 1 });

const Theatre = mongoose.models.Theatre || mongoose.model('Theatre', theatreSchema);

module.exports = Theatre;
