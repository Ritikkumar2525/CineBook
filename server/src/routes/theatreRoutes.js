const express = require('express');
const { body } = require('express-validator');
const {
  getTheatres,
  getTheatre,
  createTheatre,
  updateTheatre,
  deleteTheatre,
} = require('../controllers/theatreController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const theatreValidation = [
  body('name').trim().notEmpty().withMessage('Theatre name is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
];

router.get('/', getTheatres);
router.get('/:id', getTheatre);
router.post('/', protect, authorize('admin'), validate(theatreValidation), createTheatre);
router.put('/:id', protect, authorize('admin'), updateTheatre);
router.delete('/:id', protect, authorize('admin'), deleteTheatre);

module.exports = router;
