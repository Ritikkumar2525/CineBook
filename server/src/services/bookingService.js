const crypto = require('crypto');
const QRCode = require('qrcode');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const SeatHold = require('../models/SeatHold');
const Showtime = require('../models/Showtime');
const auditService = require('./auditService');
const mealCatalog = require('../config/mealCatalog');
const { runInTransaction } = require('../utils/transaction');

/**
 * Generate unique booking reference in the format BK-XXXXXXXX
 * @returns {string}
 */
const generateBookingRef = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = '';
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    ref += chars[bytes[i] % chars.length];
  }
  return `BK-${ref}`;
};

/**
 * Create a new booking from held seats within a transaction
 * @param {string} userId
 * @param {string} showtimeId
 * @param {string[]} seatIds
 * @param {Array<{itemId: string, quantity: number}>|string} [mealOrdersOrIp]
 * @param {string|Array} [maybeIp]
 * @returns {Promise<Booking>}
 */
const createBooking = async (
  userId,
  showtimeId,
  seatIds,
  mealOrdersOrIp = [],
  maybeIp = null
) => {
  let mealOrders = [];
  let ipAddress = null;

  if (Array.isArray(mealOrdersOrIp)) {
    mealOrders = mealOrdersOrIp;
    ipAddress = maybeIp;
  } else if (typeof mealOrdersOrIp === 'string') {
    ipAddress = mealOrdersOrIp;
    mealOrders = Array.isArray(maybeIp) ? maybeIp : [];
  }

  if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
    const err = new Error('Please provide at least one seat to book');
    err.statusCode = 400;
    throw err;
  }

  const showtime = await Showtime.findById(showtimeId)
    .populate('movie')
    .populate({
      path: 'screen',
      populate: { path: 'theatre' },
    });

  if (!showtime) {
    const err = new Error('Showtime not found');
    err.statusCode = 404;
    throw err;
  }

  if (showtime.status !== 'scheduled') {
    const err = new Error(`Showtime is ${showtime.status}`);
    err.statusCode = 400;
    throw err;
  }

  const screen = showtime.screen;
  if (!screen) {
    const err = new Error('Screen configuration not found for showtime');
    err.statusCode = 404;
    throw err;
  }

  // Calculate pricing per seat
  const seatCategoryLookup = new Map();
  screen.seatCategories.forEach((cat) => {
    cat.rows.forEach((row) => {
      seatCategoryLookup.set(row, {
        category: cat.name,
        price: cat.price,
      });
    });
  });

  const bookedSeatsData = [];
  let totalAmount = 0;

  for (const seatId of seatIds) {
    const [row] = seatId.split('-');
    const catInfo = seatCategoryLookup.get(row);
    if (!catInfo) {
      const err = new Error(`Invalid seat ${seatId} for this screen layout`);
      err.statusCode = 400;
      throw err;
    }
    bookedSeatsData.push({
      seatId,
      category: catInfo.category,
      price: catInfo.price,
    });
    totalAmount += catInfo.price;
  }

  // Calculate meal orders if provided
  const mealCatalog = require('../config/mealCatalog');
  const mealLookup = new Map(mealCatalog.map((m) => [m.id, m]));
  const formattedMealOrders = [];
  let mealTotal = 0;

  if (Array.isArray(mealOrders) && mealOrders.length > 0) {
    for (const item of mealOrders) {
      const catalogItem = mealLookup.get(item.itemId);
      if (catalogItem) {
        const qty = Math.max(1, Math.min(10, parseInt(item.quantity, 10) || 1));
        const price = catalogItem.price;
        formattedMealOrders.push({
          itemId: catalogItem.id,
          name: catalogItem.name,
          category: catalogItem.category,
          quantity: qty,
          price: price,
        });
        mealTotal += price * qty;
      }
    }
  }

  totalAmount += mealTotal;

  return await runInTransaction(async (session) => {
    // Verify holds exist and belong to user and not expired
    const activeHoldsQuery = SeatHold.find({
      showtime: showtimeId,
      seatId: { $in: seatIds },
      user: userId,
      status: 'held',
      expiresAt: { $gt: new Date() },
    });

    if (session) activeHoldsQuery.session(session);
    const activeHolds = await activeHoldsQuery;

    if (activeHolds.length !== seatIds.length) {
      const heldSeatsFound = new Set(activeHolds.map((h) => h.seatId));
      const missingSeats = seatIds.filter((s) => !heldSeatsFound.has(s));
      const err = new Error(
        `Seat hold has expired or was not found for seat(s): ${missingSeats.join(', ')}. Please re-select your seats.`
      );
      err.statusCode = 400;
      err.missingSeats = missingSeats;
      throw err;
    }

    // Generate unique bookingRef
    let bookingRef = generateBookingRef();
    let isUnique = false;
    while (!isUnique) {
      const checkQuery = Booking.findOne({ bookingRef });
      if (session) checkQuery.session(session);
      const existing = await checkQuery;
      if (!existing) {
        isUnique = true;
      } else {
        bookingRef = generateBookingRef();
      }
    }

    // Generate base64 QR code encoding the booking reference
    const qrCode = await QRCode.toDataURL(bookingRef, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
    });

    const [booking] = await Booking.create(
      [
        {
          user: userId,
          showtime: showtimeId,
          seats: bookedSeatsData,
          mealOrders: formattedMealOrders,
          mealTotal,
          totalAmount,
          bookingRef,
          qrCode,
          status: 'confirmed',
          paymentStatus: 'completed',
        },
      ],
      session ? { session } : {}
    );

    // Update SeatHold status to 'booked'
    await SeatHold.updateMany(
      {
        _id: { $in: activeHolds.map((h) => h._id) },
      },
      {
        $set: { status: 'booked' },
      },
      session ? { session } : {}
    );

    // Audit log
    await auditService.log(
      userId,
      'CREATE_BOOKING',
      'Booking',
      booking._id,
      {
        bookingRef,
        totalAmount,
        seatCount: seatIds.length,
        seats: seatIds,
        mealOrdersCount: formattedMealOrders.length,
        mealTotal,
        showtimeId,
      },
      ipAddress
    );

    // Populate booking details for response
    return await Booking.findById(booking._id)
      .populate('user', 'name email phone')
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie' },
          { path: 'screen', populate: { path: 'theatre' } },
        ],
      });
  });
};

/**
 * Cancel a booking and release its seats
 * @param {string} bookingId
 * @param {string} userId
 * @param {boolean} isAdmin
 * @param {string} [ipAddress]
 * @returns {Promise<Booking>}
 */
const cancelBooking = async (bookingId, userId, isAdmin = false, ipAddress = null) => {
  const booking = await Booking.findById(bookingId).populate('showtime');
  if (!booking) {
    const err = new Error('Booking not found');
    err.statusCode = 404;
    throw err;
  }

  if (!isAdmin && booking.user.toString() !== userId.toString()) {
    const err = new Error('You are not authorized to cancel this booking');
    err.statusCode = 403;
    throw err;
  }

  if (booking.status === 'cancelled') {
    const err = new Error('Booking is already cancelled');
    err.statusCode = 400;
    throw err;
  }

  if (booking.status === 'used') {
    const err = new Error('Cannot cancel a ticket that has already been used');
    err.statusCode = 400;
    throw err;
  }

  const seatIds = booking.seats.map((s) => s.seatId);

  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  booking.paymentStatus = 'refunded';
  await booking.save();

  // Release the booked seats
  await SeatHold.updateMany(
    {
      showtime: booking.showtime._id,
      seatId: { $in: seatIds },
      status: 'booked',
    },
    {
      $set: { status: 'released' },
    }
  );

  await auditService.log(
    userId,
    'CANCEL_BOOKING',
    'Booking',
    booking._id,
    {
      bookingRef: booking.bookingRef,
      seats: seatIds,
      totalAmount: booking.totalAmount,
    },
    ipAddress
  );

  return await Booking.findById(booking._id)
    .populate('user', 'name email phone')
    .populate({
      path: 'showtime',
      populate: [
        { path: 'movie' },
        { path: 'screen', populate: { path: 'theatre' } },
      ],
    });
};

/**
 * Validate ticket by bookingRef
 * @param {string} bookingRef
 * @param {string} [validatorUserId]
 * @param {string} [ipAddress]
 * @returns {Promise<{ valid: boolean, message: string, booking: Booking }>}
 */
const validateTicket = async (bookingRef, validatorUserId = null, ipAddress = null) => {
  if (!bookingRef) {
    const err = new Error('Booking reference is required for validation');
    err.statusCode = 400;
    throw err;
  }

  const booking = await Booking.findOne({ bookingRef })
    .populate('user', 'name email phone')
    .populate({
      path: 'showtime',
      populate: [
        { path: 'movie' },
        { path: 'screen', populate: { path: 'theatre' } },
      ],
    });

  if (!booking) {
    return {
      valid: false,
      message: 'Ticket not found. Invalid booking reference.',
      booking: null,
    };
  }

  if (booking.status === 'cancelled') {
    return {
      valid: false,
      message: 'Ticket has been cancelled and refunded.',
      booking,
    };
  }

  if (booking.status === 'used') {
    return {
      valid: false,
      message: `Ticket has already been used on ${new Date(booking.usedAt).toLocaleString()}.`,
      booking,
    };
  }

  // Mark ticket as used
  booking.status = 'used';
  booking.usedAt = new Date();
  await booking.save();

  await auditService.log(
    validatorUserId,
    'VALIDATE_TICKET',
    'Booking',
    booking._id,
    {
      bookingRef,
      usedAt: booking.usedAt,
    },
    ipAddress
  );

  return {
    valid: true,
    message: 'Ticket validated successfully! Enjoy the show.',
    booking,
  };
};

/**
 * Get paginated bookings for a user
 * @param {string} userId
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<Object>}
 */
const getUserBookings = async (userId, page = 1, limit = 10) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (pageNum - 1) * limitNum;

  const total = await Booking.countDocuments({ user: userId });
  const bookings = await Booking.find({ user: userId })
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

  return {
    bookings,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  };
};

module.exports = {
  createBooking,
  cancelBooking,
  validateTicket,
  getUserBookings,
  generateBookingRef,
};
