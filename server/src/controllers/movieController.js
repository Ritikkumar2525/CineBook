const Movie = require('../models/Movie');
const Showtime = require('../models/Showtime');
const Theatre = require('../models/Theatre');
const Screen = require('../models/Screen');
const auditService = require('../services/auditService');

/**
 * @desc    Get all movies with search, filters, pagination
 * @route   GET /api/movies
 * @access  Public
 */
const getMovies = async (req, res, next) => {
  try {
    const {
      search,
      genre,
      language,
      format,
      status,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const query = {};

    if (search && search.trim()) {
      const term = search.trim();
      const searchRegex = { $regex: term, $options: 'i' };

      // Search matching theatres/cities to find movies screening there
      const matchedTheatres = await Theatre.find({
        $or: [{ name: searchRegex }, { city: searchRegex }, { location: searchRegex }],
      }).select('_id');

      let movieIdsFromTheatres = [];
      if (matchedTheatres.length > 0) {
        const theatreIds = matchedTheatres.map((t) => t._id);
        const screens = await Screen.find({ theatre: { $in: theatreIds } }).select('_id');
        const screenIds = screens.map((s) => s._id);
        movieIdsFromTheatres = await Showtime.find({ screen: { $in: screenIds } }).distinct('movie');
      }

      const orConditions = [
        { title: searchRegex },
        { genre: searchRegex },
        { description: searchRegex },
      ];

      if (movieIdsFromTheatres.length > 0) {
        orConditions.push({ _id: { $in: movieIdsFromTheatres } });
      }

      query.$or = orConditions;
    }

    if (genre && genre !== 'all') {
      query.genre = { $in: Array.isArray(genre) ? genre : [genre] };
    }

    if (language) {
      query.language = { $regex: new RegExp(`^${language.trim()}$`, 'i') };
    }

    if (format && format !== 'all') {
      query.format = format;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;
    const sortOrder = order === 'asc' ? 1 : -1;

    const total = await Movie.countDocuments(query);
    const movies = await Movie.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: movies.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      data: movies,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single movie by ID
 * @route   GET /api/movies/:id
 * @access  Public
 */
const getMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    res.status(200).json({
      success: true,
      data: movie,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new movie
 * @route   POST /api/movies
 * @access  Private/Admin
 */
const createMovie = async (req, res, next) => {
  try {
    const movie = await Movie.create(req.body);

    await auditService.log(
      req.user._id,
      'CREATE_MOVIE',
      'Movie',
      movie._id,
      { title: movie.title, format: movie.format },
      req.ip
    );

    res.status(201).json({
      success: true,
      data: movie,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a movie
 * @route   PUT /api/movies/:id
 * @access  Private/Admin
 */
const updateMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    await auditService.log(
      req.user._id,
      'UPDATE_MOVIE',
      'Movie',
      movie._id,
      { title: movie.title, updates: req.body },
      req.ip
    );

    res.status(200).json({
      success: true,
      data: movie,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a movie
 * @route   DELETE /api/movies/:id
 * @access  Private/Admin
 */
const deleteMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    // Check if there are active future showtimes for this movie
    const activeShowtimes = await Showtime.countDocuments({
      movie: movie._id,
      status: 'scheduled',
      startTime: { $gt: new Date() },
    });

    if (activeShowtimes > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete movie with ${activeShowtimes} active upcoming showtimes. Please cancel or reassign them first.`,
      });
    }

    await Movie.findByIdAndDelete(req.params.id);

    await auditService.log(
      req.user._id,
      'DELETE_MOVIE',
      'Movie',
      movie._id,
      { title: movie.title },
      req.ip
    );

    res.status(200).json({
      success: true,
      message: 'Movie deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all distinct genres
 * @route   GET /api/movies/genres
 * @access  Public
 */
const getGenres = async (req, res, next) => {
  try {
    const genres = await Movie.distinct('genre');
    const sortedGenres = genres.filter(Boolean).sort();

    res.status(200).json({
      success: true,
      data: sortedGenres,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMovies,
  getMovie,
  createMovie,
  updateMovie,
  deleteMovie,
  getGenres,
};
