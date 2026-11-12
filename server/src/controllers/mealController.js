const mealCatalog = require('../config/mealCatalog');

/**
 * @desc    Get in-seat meal and snack catalog
 * @route   GET /api/meals
 * @access  Public
 */
const getMeals = async (req, res, next) => {
  try {
    const { category, isVeg } = req.query;
    let items = [...mealCatalog];

    if (category) {
      items = items.filter(
        (m) => m.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (isVeg !== undefined) {
      const vegBool = isVeg === 'true' || isVeg === true;
      items = items.filter((m) => m.isVeg === vegBool);
    }

    // Extract unique categories
    const categories = Array.from(new Set(mealCatalog.map((m) => m.category)));

    res.status(200).json({
      success: true,
      count: items.length,
      categories,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single meal by ID
 * @route   GET /api/meals/:id
 * @access  Public
 */
const getMealById = async (req, res, next) => {
  try {
    const item = mealCatalog.find((m) => m.id === req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Meal item not found',
      });
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMeals,
  getMealById,
};
