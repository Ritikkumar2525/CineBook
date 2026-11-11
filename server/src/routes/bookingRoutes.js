const express = require('express');
const { body } = require('express-validator');
const {
  holdSeats,
  createBooking,
  cancelBooking,
  validateTicket,
  getMyBookings,
  getAllBookings,
  getBooking,
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const holdValidation = [
  body('showtimeId').notEmpty().withMessage('Showtime ID is required'),
  body('seats')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Seats must be a non-empty array of seat IDs'),
  body('seatIds')
    .optional()
    .isArray({ min: 1 })
    .withMessage('SeatIds must be a non-empty array of seat IDs'),
];

const bookingValidation = [
  body('showtimeId').notEmpty().withMessage('Showtime ID is required'),
  body('seats')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Seats must be a non-empty array of seat IDs'),
  body('seatIds')
    .optional()
    .isArray({ min: 1 })
    .withMessage('SeatIds must be a non-empty array of seat IDs'),
];

const validateTicketValidation = [
  body('bookingRef').trim().notEmpty().withMessage('Booking reference is required'),
];

router.post('/hold', protect, validate(holdValidation), holdSeats);
router.post('/', protect, validate(bookingValidation), createBooking);
router.post('/validate', protect, authorize('admin'), validate(validateTicketValidation), validateTicket);
router.get('/my-bookings', protect, getMyBookings);
router.get('/', protect, authorize('admin'), getAllBookings);
router.get('/:id', protect, getBooking);
router.patch('/:id/cancel', protect, cancelBooking);

module.exports = router;
