const Showtime = require('../models/Showtime');
const Movie = require('../models/Movie');
const Screen = require('../models/Screen');
const SeatHold = require('../models/SeatHold');
const seatHoldService = require('../services/seatHoldService');
const auditService = require('../services/auditService');

/**
 * @desc    Get showtimes with filters
 * @route   GET /api/showtimes
 * @access  Public
 */
const getShowtimes = async (req, res, next) => {
  try {
    const { movie, screen, theatre, date, startDate, endDate, status } = req.query;
    const query = {};

    if (movie) query.movie = movie;
    if (screen) query.screen = screen;
    if (status) query.status = status;

    if (theatre) {
      const screenDocs = await Screen.find({ theatre }).select('_id');
      const screenIds = screenDocs.map((s) => s._id);
      query.screen = { $in: screenIds };
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.startTime = { $gte: startOfDay, $lte: endOfDay };
    } else if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const showtimes = await Showtime.find(query)
      .populate('movie')
      .populate({
        path: 'screen',
        populate: { path: 'theatre' },
      })
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      count: showtimes.length,
      data: showtimes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single showtime with full seat map and availability
 * @route   GET /api/showtimes/:id
 * @access  Public
 */
const getShowtime = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : null;
    const availability = await seatHoldService.getAvailability(req.params.id, userId);

    res.status(200).json({
      success: true,
      data: availability,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new showtime (with overlap validation)
 * @route   POST /api/showtimes
 * @access  Private/Admin
 */
const createShowtime = async (req, res, next) => {
  try {
    let { movie, screen, startTime, endTime, status } = req.body;

    const movieDoc = await Movie.findById(movie);
    if (!movieDoc) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    const screenDoc = await Screen.findById(screen);
    if (!screenDoc) {
      return res.status(404).json({
        success: false,
        message: 'Screen not found',
      });
    }

    const start = new Date(startTime);
    let end = endTime ? new Date(endTime) : null;

    if (!end) {
      // Auto-compute endTime: duration + 15 min buffer
      end = new Date(start.getTime() + (movieDoc.duration + 15) * 60 * 1000);
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'Showtime start time must be before end time',
      });
    }

    // Check for overlapping shows on the same screen
    const conflict = await Showtime.findOne({
      screen,
      status: { $ne: 'cancelled' },
      startTime: { $lt: end },
      endTime: { $gt: start },
    }).populate('movie');

    if (conflict) {
      return res.status(400).json({
        success: false,
        message: `Conflict detected: Screen already has '${conflict.movie ? conflict.movie.title : 'another show'}' scheduled from ${new Date(conflict.startTime).toLocaleTimeString()} to ${new Date(conflict.endTime).toLocaleTimeString()}`,
      });
    }

    const showtime = await Showtime.create({
      movie,
      screen,
      startTime: start,
      endTime: end,
      status: status || 'scheduled',
    });

    await auditService.log(
      req.user._id,
      'CREATE_SHOWTIME',
      'Showtime',
      showtime._id,
      {
        movie: movieDoc.title,
        screen: screenDoc.name,
        startTime: start,
        endTime: end,
      },
      req.ip
    );

    const populated = await Showtime.findById(showtime._id)
      .populate('movie')
      .populate({
        path: 'screen',
        populate: { path: 'theatre' },
      });

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a showtime
 * @route   PUT /api/showtimes/:id
 * @access  Private/Admin
 */
const updateShowtime = async (req, res, next) => {
  try {
    const existing = await Showtime.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Showtime not found',
      });
    }

    const screenId = req.body.screen || existing.screen;
    const start = req.body.startTime ? new Date(req.body.startTime) : existing.startTime;
    const end = req.body.endTime ? new Date(req.body.endTime) : existing.endTime;

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'Showtime start time must be before end time',
      });
    }

    // Validate overlap
    const conflict = await Showtime.findOne({
      _id: { $ne: existing._id },
      screen: screenId,
      status: { $ne: 'cancelled' },
      startTime: { $lt: end },
      endTime: { $gt: start },
    }).populate('movie');

    if (conflict) {
      return res.status(400).json({
        success: false,
        message: `Conflict detected: Screen already has '${conflict.movie ? conflict.movie.title : 'another show'}' scheduled from ${new Date(conflict.startTime).toLocaleTimeString()} to ${new Date(conflict.endTime).toLocaleTimeString()}`,
      });
    }

    const updated = await Showtime.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        startTime: start,
        endTime: end,
      },
      { new: true, runValidators: true }
    )
      .populate('movie')
      .populate({
        path: 'screen',
        populate: { path: 'theatre' },
      });

    await auditService.log(
      req.user._id,
      'UPDATE_SHOWTIME',
      'Showtime',
      updated._id,
      { updates: req.body },
      req.ip
    );

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel a showtime
 * @route   PATCH /api/showtimes/:id/cancel
 * @access  Private/Admin
 */
const cancelShowtime = async (req, res, next) => {
  try {
    const showtime = await Showtime.findById(req.params.id);

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: 'Showtime not found',
      });
    }

    showtime.status = 'cancelled';
    await showtime.save();

    // Release any active seat holds for this cancelled showtime
    await SeatHold.updateMany(
      { showtime: showtime._id, status: 'held' },
      { $set: { status: 'released' } }
    );

    await auditService.log(
      req.user._id,
      'CANCEL_SHOWTIME',
      'Showtime',
      showtime._id,
      {},
      req.ip
    );

    const populated = await Showtime.findById(showtime._id)
      .populate('movie')
      .populate({
        path: 'screen',
        populate: { path: 'theatre' },
      });

    res.status(200).json({
      success: true,
      message: 'Showtime cancelled successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get showtimes grouped by theatre & date for a movie
 * @route   GET /api/showtimes/movie/:movieId
 * @access  Public
 */
const getShowtimesByMovie = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const { city, date } = req.query;

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    const query = {
      movie: movieId,
      status: 'scheduled',
    };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.startTime = { $gte: startOfDay, $lte: endOfDay };
    } else {
      // By default show all showtimes from start of today onwards
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      query.startTime = { $gte: startOfToday };
    }

    const showtimes = await Showtime.find(query)
      .populate({
        path: 'screen',
        populate: { path: 'theatre' },
      })
      .sort({ startTime: 1 });

    // Filter by city if specified
    const filteredShowtimes = city
      ? showtimes.filter((s) => s.screen?.theatre?.city?.toLowerCase() === city.toLowerCase())
      : showtimes;

    // Group by theatre and date
    const theatreMap = new Map();

    filteredShowtimes.forEach((show) => {
      if (!show.screen || !show.screen.theatre) return;
      const theatre = show.screen.theatre;
      const theatreId = theatre._id.toString();

      if (!theatreMap.has(theatreId)) {
        theatreMap.set(theatreId, {
          theatre: {
            _id: theatre._id,
            name: theatre.name,
            location: theatre.location,
            city: theatre.city,
            facilities: theatre.facilities,
          },
          showtimes: [],
        });
      }

      const minPrice =
        show.screen.seatCategories && show.screen.seatCategories.length > 0
          ? Math.min(...show.screen.seatCategories.map((c) => c.price))
          : 0;

      theatreMap.get(theatreId).showtimes.push({
        _id: show._id,
        startTime: show.startTime,
        endTime: show.endTime,
        screen: {
          _id: show.screen._id,
          name: show.screen.name,
          screenType: show.screen.screenType,
        },
        minPrice,
      });
    });

    res.status(200).json({
      success: true,
      count: filteredShowtimes.length,
      data: filteredShowtimes,
      showtimes: filteredShowtimes,
      movie: {
        _id: movie._id,
        title: movie.title,
        duration: movie.duration,
        genre: movie.genre,
        language: movie.language,
        format: movie.format,
        posterUrl: movie.posterUrl,
        rating: movie.rating,
      },
      theatres: Array.from(theatreMap.values()),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShowtimes,
  getShowtime,
  createShowtime,
  updateShowtime,
  cancelShowtime,
  getShowtimesByMovie,
};
