const express = require('express');
const router = express.Router();
const { getMeals, getMealById } = require('../controllers/mealController');

router.get('/', getMeals);
router.get('/:id', getMealById);

module.exports = router;
