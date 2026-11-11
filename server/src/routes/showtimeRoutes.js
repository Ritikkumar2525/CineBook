const express = require('express');
const { body } = require('express-validator');
const {
  getShowtimes,
  getShowtime,
  createShowtime,
  updateShowtime,
  cancelShowtime,
  getShowtimesByMovie,
} = require('../controllers/showtimeController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const showtimeValidation = [
  body('movie').notEmpty().withMessage('Movie ID is required'),
  body('screen').notEmpty().withMessage('Screen ID is required'),
  body('startTime').isISO8601().withMessage('Valid ISO8601 start time is required'),
  body('endTime').optional().isISO8601().withMessage('End time must be valid ISO8601 date'),
];

router.get('/', getShowtimes);
router.get('/movie/:movieId', getShowtimesByMovie);
router.get('/:id', optionalAuth, getShowtime);
router.post('/', protect, authorize('admin'), validate(showtimeValidation), createShowtime);
router.put('/:id', protect, authorize('admin'), updateShowtime);
router.patch('/:id/cancel', protect, authorize('admin'), cancelShowtime);

module.exports = router;
