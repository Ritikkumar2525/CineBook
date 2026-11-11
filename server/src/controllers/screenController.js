const Screen = require('../models/Screen');
const Theatre = require('../models/Theatre');
const Showtime = require('../models/Showtime');
const auditService = require('../services/auditService');

/**
 * Compute total seats from seat categories
 * @param {Array} categories
 * @returns {number}
 */
const calculateTotalSeats = (categories) => {
  if (!Array.isArray(categories)) return 0;
  return categories.reduce((total, cat) => {
    const rowCount = Array.isArray(cat.rows) ? cat.rows.length : 0;
    const seatsPerRow = parseInt(cat.seatsPerRow, 10) || 0;
    return total + rowCount * seatsPerRow;
  }, 0);
};

/**
 * @desc    Get all screens, optionally filtered by theatre
 * @route   GET /api/screens
 * @access  Public
 */
const getScreens = async (req, res, next) => {
  try {
    const { theatre } = req.query;
    const query = {};

    if (theatre) {
      query.theatre = theatre;
    }

    const screens = await Screen.find(query).populate('theatre').sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: screens.length,
      data: screens,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single screen by ID
 * @route   GET /api/screens/:id
 * @access  Public
 */
const getScreen = async (req, res, next) => {
  try {
    const screen = await Screen.findById(req.params.id).populate('theatre');

    if (!screen) {
      return res.status(404).json({
        success: false,
        message: 'Screen not found',
      });
    }

    res.status(200).json({
      success: true,
      data: screen,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new screen
 * @route   POST /api/screens
 * @access  Private/Admin
 */
const createScreen = async (req, res, next) => {
  try {
    const { theatre, name, screenType, seatCategories } = req.body;

    const theatreExists = await Theatre.findById(theatre);
    if (!theatreExists) {
      return res.status(404).json({
        success: false,
        message: 'Associated theatre not found',
      });
    }

    const totalSeats = calculateTotalSeats(seatCategories);

    const screen = await Screen.create({
      theatre,
      name,
      screenType: screenType || 'Standard',
      seatCategories: seatCategories || [],
      totalSeats,
    });

    await auditService.log(
      req.user._id,
      'CREATE_SCREEN',
      'Screen',
      screen._id,
      { name: screen.name, theatreId: screen.theatre, totalSeats },
      req.ip
    );

    const populatedScreen = await Screen.findById(screen._id).populate('theatre');

    res.status(201).json({
      success: true,
      data: populatedScreen,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a screen
 * @route   PUT /api/screens/:id
 * @access  Private/Admin
 */
const updateScreen = async (req, res, next) => {
  try {
    const updates = { ...req.body };

    if (updates.seatCategories) {
      updates.totalSeats = calculateTotalSeats(updates.seatCategories);
    }

    const screen = await Screen.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('theatre');

    if (!screen) {
      return res.status(404).json({
        success: false,
        message: 'Screen not found',
      });
    }

    await auditService.log(
      req.user._id,
      'UPDATE_SCREEN',
      'Screen',
      screen._id,
      { name: screen.name, updates: req.body },
      req.ip
    );

    res.status(200).json({
      success: true,
      data: screen,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a screen
 * @route   DELETE /api/screens/:id
 * @access  Private/Admin
 */
const deleteScreen = async (req, res, next) => {
  try {
    const screen = await Screen.findById(req.params.id);

    if (!screen) {
      return res.status(404).json({
        success: false,
        message: 'Screen not found',
      });
    }

    // Check if upcoming active showtimes exist on this screen
    const upcomingShows = await Showtime.countDocuments({
      screen: screen._id,
      status: 'scheduled',
      startTime: { $gt: new Date() },
    });

    if (upcomingShows > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete screen with ${upcomingShows} active upcoming showtimes. Please cancel or reassign them first.`,
      });
    }

    await Screen.findByIdAndDelete(req.params.id);

    await auditService.log(
      req.user._id,
      'DELETE_SCREEN',
      'Screen',
      screen._id,
      { name: screen.name },
      req.ip
    );

    res.status(200).json({
      success: true,
      message: 'Screen deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getScreens,
  getScreen,
  createScreen,
  updateScreen,
  deleteScreen,
};
