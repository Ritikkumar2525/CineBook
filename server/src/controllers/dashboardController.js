const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Screen = require('../models/Screen');
const Showtime = require('../models/Showtime');
const Booking = require('../models/Booking');
const User = require('../models/User');
const SeatHold = require('../models/SeatHold');
const auditService = require('../services/auditService');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/dashboard/stats
 * @access  Private/Admin
 */
const getStats = async (req, res, next) => {
  try {
    const [
      totalMovies,
      nowShowingMovies,
      totalTheatres,
      totalScreens,
      totalUsers,
      totalShowtimes,
      bookingCounts,
      revenueResult,
    ] = await Promise.all([
      Movie.countDocuments(),
      Movie.countDocuments({ status: 'now_showing' }),
      Theatre.countDocuments(),
      Screen.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Showtime.countDocuments(),
      Booking.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Booking.aggregate([
        {
          $match: {
            status: { $in: ['confirmed', 'used'] },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalTickets: { $sum: { $size: '$seats' } },
          },
        },
      ]),
    ]);

    const bookingsByStatus = {
      confirmed: 0,
      used: 0,
      cancelled: 0,
      total: 0,
    };

    bookingCounts.forEach((b) => {
      if (b._id in bookingsByStatus) {
        bookingsByStatus[b._id] = b.count;
      }
      bookingsByStatus.total += b.count;
    });

    const revenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
    const ticketsSold = revenueResult.length > 0 ? revenueResult[0].totalTickets : 0;

    res.status(200).json({
      success: true,
      data: {
        movies: {
          total: totalMovies,
          nowShowing: nowShowingMovies,
        },
        theatres: totalTheatres,
        screens: totalScreens,
        users: totalUsers,
        showtimes: totalShowtimes,
        bookings: bookingsByStatus,
        revenue,
        ticketsSold,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get occupancy report per screen / showtime
 * @route   GET /api/dashboard/occupancy
 * @access  Private/Admin
 */
const getOccupancyReport = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 20 } = req.query;
    const query = { status: { $ne: 'cancelled' } };

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    } else {
      // Default to last 7 days and next 7 days
      const past = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      query.startTime = { $gte: past, $lte: future };
    }

    const showtimes = await Showtime.find(query)
      .populate('movie', 'title duration posterUrl')
      .populate({
        path: 'screen',
        populate: { path: 'theatre', select: 'name city' },
      })
      .sort({ startTime: -1 })
      .limit(parseInt(limit, 10));

    // Calculate booked seat counts for each showtime
    const report = await Promise.all(
      showtimes.map(async (show) => {
        const bookedCount = await SeatHold.countDocuments({
          showtime: show._id,
          status: 'booked',
        });

        const totalSeats = show.screen?.totalSeats || 0;
        const occupancyPercentage =
          totalSeats > 0 ? Number(((bookedCount / totalSeats) * 100).toFixed(1)) : 0;

        return {
          showtimeId: show._id,
          movieTitle: show.movie?.title || 'Unknown Movie',
          theatreName: show.screen?.theatre?.name || 'Unknown Theatre',
          theatreCity: show.screen?.theatre?.city || '',
          screenName: show.screen?.name || 'Unknown Screen',
          screenType: show.screen?.screenType || 'Standard',
          startTime: show.startTime,
          totalSeats,
          bookedSeats: bookedCount,
          availableSeats: Math.max(0, totalSeats - bookedCount),
          occupancyPercentage,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: report.length,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get sales and revenue breakdown
 * @route   GET /api/dashboard/sales
 * @access  Private/Admin
 */
const getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {
      status: { $in: ['confirmed', 'used'] },
    };

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      match.createdAt = { $gte: thirtyDaysAgo };
    }

    // Daily revenue aggregation
    const dailySales = await Booking.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          bookingsCount: { $sum: 1 },
          ticketsCount: { $sum: { $size: '$seats' } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Revenue by Movie
    const movieSales = await Booking.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'showtimes',
          localField: 'showtime',
          foreignField: '_id',
          as: 'showtimeData',
        },
      },
      { $unwind: '$showtimeData' },
      {
        $lookup: {
          from: 'movies',
          localField: 'showtimeData.movie',
          foreignField: '_id',
          as: 'movieData',
        },
      },
      { $unwind: '$movieData' },
      {
        $group: {
          _id: '$movieData._id',
          title: { $first: '$movieData.title' },
          posterUrl: { $first: '$movieData.posterUrl' },
          revenue: { $sum: '$totalAmount' },
          ticketsSold: { $sum: { $size: '$seats' } },
          bookingsCount: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);

    // Revenue by Theatre
    const theatreSales = await Booking.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'showtimes',
          localField: 'showtime',
          foreignField: '_id',
          as: 'showtimeData',
        },
      },
      { $unwind: '$showtimeData' },
      {
        $lookup: {
          from: 'screens',
          localField: 'showtimeData.screen',
          foreignField: '_id',
          as: 'screenData',
        },
      },
      { $unwind: '$screenData' },
      {
        $lookup: {
          from: 'theatres',
          localField: 'screenData.theatre',
          foreignField: '_id',
          as: 'theatreData',
        },
      },
      { $unwind: '$theatreData' },
      {
        $group: {
          _id: '$theatreData._id',
          name: { $first: '$theatreData.name' },
          city: { $first: '$theatreData.city' },
          revenue: { $sum: '$totalAmount' },
          ticketsSold: { $sum: { $size: '$seats' } },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    // Summary totals
    const totalRevenue = dailySales.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalTickets = dailySales.reduce((acc, curr) => acc + curr.ticketsCount, 0);
    const totalBookings = dailySales.reduce((acc, curr) => acc + curr.bookingsCount, 0);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalTickets,
          totalBookings,
          averageTicketPrice: totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 0,
        },
        dailySales,
        movieSales,
        theatreSales,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get recent bookings for admin feed
 * @route   GET /api/dashboard/recent-bookings
 * @access  Private/Admin
 */
const getRecentBookings = async (req, res, next) => {
  try {
    const recentBookings = await Booking.find()
      .populate('user', 'name email phone')
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie', select: 'title posterUrl duration' },
          { path: 'screen', populate: { path: 'theatre', select: 'name city' } },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      count: recentBookings.length,
      data: recentBookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get paginated audit logs
 * @route   GET /api/dashboard/audit-logs
 * @access  Private/Admin
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { action, entityType, entityId, userId, startDate, endDate, page = 1, limit = 20 } =
      req.query;

    const result = await auditService.getAuditLogs(
      {
        action,
        entityType,
        entityId,
        userId,
        startDate,
        endDate,
      },
      page,
      limit
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getOccupancyReport,
  getSalesReport,
  getRecentBookings,
  getAuditLogs,
};
