const Theatre = require('../models/Theatre');
const Screen = require('../models/Screen');
const Showtime = require('../models/Showtime');
const auditService = require('../services/auditService');

/**
 * @desc    Get all theatres with optional city filter and search
 * @route   GET /api/theatres
 * @access  Public
 */
const getTheatres = async (req, res, next) => {
  try {
    const { city, search } = req.query;
    const query = {};

    if (city) {
      query.city = { $regex: new RegExp(`^${city.trim()}$`, 'i') };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { location: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const theatres = await Theatre.find(query).populate('screens').sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: theatres.length,
      data: theatres,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single theatre by ID with screens
 * @route   GET /api/theatres/:id
 * @access  Public
 */
const getTheatre = async (req, res, next) => {
  try {
    const theatre = await Theatre.findById(req.params.id).populate('screens');

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found',
      });
    }

    res.status(200).json({
      success: true,
      data: theatre,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new theatre
 * @route   POST /api/theatres
 * @access  Private/Admin
 */
const createTheatre = async (req, res, next) => {
  try {
    const theatre = await Theatre.create(req.body);

    await auditService.log(
      req.user._id,
      'CREATE_THEATRE',
      'Theatre',
      theatre._id,
      { name: theatre.name, city: theatre.city },
      req.ip
    );

    res.status(201).json({
      success: true,
      data: theatre,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a theatre
 * @route   PUT /api/theatres/:id
 * @access  Private/Admin
 */
const updateTheatre = async (req, res, next) => {
  try {
    const theatre = await Theatre.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('screens');

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found',
      });
    }

    await auditService.log(
      req.user._id,
      'UPDATE_THEATRE',
      'Theatre',
      theatre._id,
      { name: theatre.name, updates: req.body },
      req.ip
    );

    res.status(200).json({
      success: true,
      data: theatre,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a theatre
 * @route   DELETE /api/theatres/:id
 * @access  Private/Admin
 */
const deleteTheatre = async (req, res, next) => {
  try {
    const theatre = await Theatre.findById(req.params.id);

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found',
      });
    }

    // Check if there are screens
    const screenCount = await Screen.countDocuments({ theatre: theatre._id });
    if (screenCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete theatre that has ${screenCount} screens. Please delete or reassign screens first.`,
      });
    }

    await Theatre.findByIdAndDelete(req.params.id);

    await auditService.log(
      req.user._id,
      'DELETE_THEATRE',
      'Theatre',
      theatre._id,
      { name: theatre.name },
      req.ip
    );

    res.status(200).json({
      success: true,
      message: 'Theatre deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTheatres,
  getTheatre,
  createTheatre,
  updateTheatre,
  deleteTheatre,
};
