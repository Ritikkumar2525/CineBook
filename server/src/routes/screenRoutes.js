const express = require('express');
const { body } = require('express-validator');
const {
  getScreens,
  getScreen,
  createScreen,
  updateScreen,
  deleteScreen,
} = require('../controllers/screenController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const screenValidation = [
  body('theatre').notEmpty().withMessage('Theatre ID is required'),
  body('name').trim().notEmpty().withMessage('Screen name is required'),
  body('seatCategories').isArray({ min: 1 }).withMessage('At least one seat category is required'),
];

router.get('/', getScreens);
router.get('/:id', getScreen);
router.post('/', protect, authorize('admin'), validate(screenValidation), createScreen);
router.put('/:id', protect, authorize('admin'), updateScreen);
router.delete('/:id', protect, authorize('admin'), deleteScreen);

module.exports = router;
