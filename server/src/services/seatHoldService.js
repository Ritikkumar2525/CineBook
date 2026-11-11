const mongoose = require('mongoose');
const SeatHold = require('../models/SeatHold');
const Showtime = require('../models/Showtime');
const Screen = require('../models/Screen');
const { runInTransaction } = require('../utils/transaction');

/**
 * Release any seat holds that have expired past their expiresAt time
 * @returns {Promise<{ releasedCount: number }>}
 */
const releaseExpiredHolds = async () => {
  try {
    const result = await SeatHold.updateMany(
      {
        status: 'held',
        expiresAt: { $lte: new Date() },
      },
      {
        $set: { status: 'expired' },
      }
    );
    return { releasedCount: result.modifiedCount || 0 };
  } catch (error) {
    console.error('Error releasing expired holds:', error);
    return { releasedCount: 0 };
  }
};

/**
 * Hold seats for a user during the booking checkout flow
 * @param {string} showtimeId
 * @param {string[]} seatIds
 * @param {string} userId
 * @returns {Promise<{ holds: Array, expiresAt: Date }>}
 */
const holdSeats = async (showtimeId, seatIds, userId) => {
  if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
    const err = new Error('Please select at least one seat to hold');
    err.statusCode = 400;
    throw err;
  }

  // Release expired holds first
  await releaseExpiredHolds();

  const showtime = await Showtime.findById(showtimeId).populate('screen');
  if (!showtime) {
    const err = new Error('Showtime not found');
    err.statusCode = 404;
    throw err;
  }

  if (showtime.status !== 'scheduled') {
    const err = new Error(`Cannot hold seats for a showtime that is ${showtime.status}`);
    err.statusCode = 400;
    throw err;
  }

  if (new Date(showtime.startTime) <= new Date()) {
    const err = new Error('Cannot hold seats for a showtime that has already started');
    err.statusCode = 400;
    throw err;
  }

  // Validate seats exist in the screen configuration
  const validSeats = new Set();
  const screen = showtime.screen;
  if (screen && screen.seatCategories) {
    screen.seatCategories.forEach((cat) => {
      cat.rows.forEach((row) => {
        for (let i = 1; i <= cat.seatsPerRow; i++) {
          validSeats.add(`${row}-${i}`);
        }
      });
    });
  }

  for (const seatId of seatIds) {
    if (!validSeats.has(seatId)) {
      const err = new Error(`Seat ${seatId} does not exist in screen layout`);
      err.statusCode = 400;
      throw err;
    }
  }

  return await runInTransaction(async (session) => {
    // Check if any of the seats are currently held or booked
    const conflictQuery = SeatHold.find({
      showtime: showtimeId,
      seatId: { $in: seatIds },
      $or: [
        { status: 'booked' },
        {
          status: 'held',
          expiresAt: { $gt: new Date() },
          user: { $ne: userId },
        },
      ],
    });

    if (session) conflictQuery.session(session);
    const existingActiveHolds = await conflictQuery;

    if (existingActiveHolds.length > 0) {
      const unavailableSeats = existingActiveHolds.map((h) => h.seatId);
      const err = new Error(
        `The following seats are already reserved or held by another user: ${unavailableSeats.join(', ')}`
      );
      err.statusCode = 409;
      err.unavailableSeats = unavailableSeats;
      throw err;
    }

    const expiryMinutes = parseInt(process.env.SEAT_HOLD_EXPIRY_MINUTES || '10', 10);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Cancel / release any previous held records by the same user for these seats
    const deleteFilter = {
      showtime: showtimeId,
      seatId: { $in: seatIds },
      user: userId,
      status: 'held',
    };
    if (session) {
      await SeatHold.deleteMany(deleteFilter).session(session);
    } else {
      await SeatHold.deleteMany(deleteFilter);
    }

    const holdsToInsert = seatIds.map((seatId) => ({
      showtime: showtimeId,
      seatId,
      user: userId,
      status: 'held',
      expiresAt,
    }));

    const createdHolds = await SeatHold.insertMany(
      holdsToInsert,
      session ? { session } : {}
    );

    return {
      holds: createdHolds,
      expiresAt,
    };
  });
};

/**
 * Get all active holds for a showtime
 * @param {string} showtimeId
 * @returns {Promise<Array>}
 */
const getHeldSeats = async (showtimeId) => {
  return await SeatHold.find({
    showtime: showtimeId,
    status: 'held',
    expiresAt: { $gt: new Date() },
  }).populate('user', 'name email');
};

/**
 * Get all booked seats for a showtime
 * @param {string} showtimeId
 * @returns {Promise<Array>}
 */
const getBookedSeats = async (showtimeId) => {
  return await SeatHold.find({
    showtime: showtimeId,
    status: 'booked',
  });
};

/**
 * Get full seat map and availability status for a showtime
 * @param {string} showtimeId
 * @param {string|null} currentUserId
 * @returns {Promise<Object>}
 */
const getAvailability = async (showtimeId, currentUserId = null) => {
  await releaseExpiredHolds();

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

  const screen = showtime.screen;
  if (!screen) {
    const err = new Error('Screen details not found for this showtime');
    err.statusCode = 404;
    throw err;
  }

  const activeHolds = await getHeldSeats(showtimeId);
  const bookedSeats = await getBookedSeats(showtimeId);

  const bookedSet = new Set(bookedSeats.map((b) => b.seatId));
  const heldMap = new Map();
  activeHolds.forEach((h) => {
    heldMap.set(h.seatId, {
      userId: h.user ? h.user._id.toString() : null,
      expiresAt: h.expiresAt,
    });
  });

  const seatCategoriesMap = [];
  let totalSeatsCount = 0;
  let bookedCount = 0;
  let heldCount = 0;

  screen.seatCategories.forEach((cat) => {
    const rowsLayout = [];

    cat.rows.forEach((row) => {
      const seats = [];
      for (let i = 1; i <= cat.seatsPerRow; i++) {
        const seatId = `${row}-${i}`;
        totalSeatsCount++;

        let status = 'available';
        let isHeldByMe = false;

        if (bookedSet.has(seatId)) {
          status = 'booked';
          bookedCount++;
        } else if (heldMap.has(seatId)) {
          status = 'held';
          heldCount++;
          const holdInfo = heldMap.get(seatId);
          if (currentUserId && holdInfo.userId === currentUserId.toString()) {
            isHeldByMe = true;
          }
        }

        seats.push({
          seatId,
          row,
          number: i,
          status,
          price: cat.price,
          category: cat.name,
          color: cat.color,
          isHeldByMe,
        });
      }

      rowsLayout.push({
        row,
        seats,
      });
    });

    seatCategoriesMap.push({
      name: cat.name,
      price: cat.price,
      color: cat.color,
      seatsPerRow: cat.seatsPerRow,
      rows: rowsLayout,
    });
  });

  const availableCount = totalSeatsCount - bookedCount - heldCount;

  return {
    showtime: {
      _id: showtime._id,
      movie: showtime.movie,
      screen: {
        _id: screen._id,
        name: screen.name,
        screenType: screen.screenType,
        theatre: screen.theatre,
        totalSeats: screen.totalSeats || totalSeatsCount,
      },
      startTime: showtime.startTime,
      endTime: showtime.endTime,
      status: showtime.status,
    },
    seatCategories: seatCategoriesMap,
    totals: {
      totalSeats: totalSeatsCount,
      availableSeats: availableCount,
      bookedSeats: bookedCount,
      heldSeats: heldCount,
    },
  };
};

module.exports = {
  holdSeats,
  releaseExpiredHolds,
  getHeldSeats,
  getBookedSeats,
  getAvailability,
};
