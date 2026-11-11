const express = require('express');
const { body } = require('express-validator');
const {
  getMovies,
  getMovie,
  createMovie,
  updateMovie,
  deleteMovie,
  getGenres,
} = require('../controllers/movieController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const movieValidation = [
  body('title').trim().notEmpty().withMessage('Movie title is required'),
  body('genre').isArray({ min: 1 }).withMessage('At least one genre is required'),
  body('duration').isNumeric().withMessage('Duration must be a number in minutes'),
  body('language').trim().notEmpty().withMessage('Language is required'),
  body('format')
    .optional()
    .isIn(['2D', '3D', 'IMAX', '4DX'])
    .withMessage('Format must be 2D, 3D, IMAX, or 4DX'),
  body('status')
    .optional()
    .isIn(['now_showing', 'coming_soon', 'ended'])
    .withMessage('Status must be now_showing, coming_soon, or ended'),
];

router.get('/', getMovies);
router.get('/genres', getGenres);
router.get('/:id', getMovie);
router.post('/', protect, authorize('admin'), validate(movieValidation), createMovie);
router.put('/:id', protect, authorize('admin'), updateMovie);
router.delete('/:id', protect, authorize('admin'), deleteMovie);

module.exports = router;
