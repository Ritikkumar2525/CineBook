const Booking = require('../models/Booking');
const seatHoldService = require('../services/seatHoldService');
const bookingService = require('../services/bookingService');

/**
 * @desc    Hold selected seats for a showtime
 * @route   POST /api/bookings/hold
 * @access  Private
 */
const holdSeats = async (req, res, next) => {
  try {
    const { showtimeId, seats, seatIds } = req.body;
    const seatsToHold = seatIds || seats;

    if (!showtimeId || !seatsToHold || !Array.isArray(seatsToHold) || seatsToHold.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide showtimeId and an array of seat IDs to hold',
      });
    }

    const result = await seatHoldService.holdSeats(showtimeId, seatsToHold, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Seats held successfully',
      data: result.holds,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Confirm booking from held seats
 * @route   POST /api/bookings
 * @access  Private
 */
const createBooking = async (req, res, next) => {
  try {
    const { showtimeId, seats, seatIds } = req.body;
    const seatsToBook = seatIds || seats;

    if (!showtimeId || !seatsToBook || !Array.isArray(seatsToBook) || seatsToBook.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide showtimeId and an array of seat IDs to book',
      });
    }

    const booking = await bookingService.createBooking(
      req.user._id,
      showtimeId,
      seatsToBook,
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel a booking
 * @route   PATCH /api/bookings/:id/cancel
 * @access  Private
 */
const cancelBooking = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const booking = await bookingService.cancelBooking(
      req.params.id,
      req.user._id,
      isAdmin,
      req.ip
    );

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Validate ticket by bookingRef (e.g., ticket scanner)
 * @route   POST /api/bookings/validate
 * @access  Private/Admin
 */
const validateTicket = async (req, res, next) => {
  try {
    const { bookingRef } = req.body;

    if (!bookingRef) {
      return res.status(400).json({
        success: false,
        message: 'Booking reference is required',
      });
    }

    const result = await bookingService.validateTicket(
      bookingRef.trim(),
      req.user._id,
      req.ip
    );

    const statusCode = result.valid ? 200 : 400;

    res.status(statusCode).json({
      success: result.valid,
      message: result.message,
      data: result.booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user's bookings
 * @route   GET /api/bookings/my-bookings
 * @access  Private
 */
const getMyBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await bookingService.getUserBookings(req.user._id, page, limit);

    res.status(200).json({
      success: true,
      data: result.bookings,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all bookings (Admin)
 * @route   GET /api/bookings
 * @access  Private/Admin
 */
const getAllBookings = async (req, res, next) => {
  try {
    const {
      status,
      paymentStatus,
      showtime,
      user,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (showtime) query.showtime = showtime;
    if (user) query.user = user;
    if (search) query.bookingRef = { $regex: search.trim(), $options: 'i' };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const skip = (pageNum - 1) * limitNum;

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie' },
          { path: 'screen', populate: { path: 'theatre' } },
        ],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single booking by ID
 * @route   GET /api/bookings/:id
 * @access  Private
 */
const getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie' },
          { path: 'screen', populate: { path: 'theatre' } },
        ],
      });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Ensure user can only view their own bookings unless admin
    if (
      req.user.role !== 'admin' &&
      booking.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking',
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  holdSeats,
  createBooking,
  cancelBooking,
  validateTicket,
  getMyBookings,
  getAllBookings,
  getBooking,
};
