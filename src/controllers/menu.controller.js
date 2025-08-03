const MenuItem = require('../models/MenuItem');

exports.createMenuItem = async (req, res, next) => {
  try {
    const menuItem = new MenuItem(req.body);
    await menuItem.save();
    res.status(201).json(menuItem);
  } catch (error) {
    next(error);
  }
};

exports.getAllMenuItems = async (req, res, next) => {
  try {
    // Filtering
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.dietary) filter.dietaryTags = { $in: [req.query.dietary] };
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Sorting
    const sort = {};
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':');
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }

    // Pagination
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const menuItems = await MenuItem.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const totalItems = await MenuItem.countDocuments(filter);

    res.json({
      items: menuItems,
      total: totalItems,
      page,
      pages: Math.ceil(totalItems / limit)
    });
  } catch (error) {
    next(error);
  }
};

exports.getMenuItemById = async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json(menuItem);
  } catch (error) {
    next(error);
  }
};

exports.updateMenuItem = async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json(menuItem);
  } catch (error) {
    next(error);
  }
};

exports.deleteMenuItem = async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    // Get all unique categories from the database
    const categories = await MenuItem.distinct('category');
    
    // Get count of items in each category
    const categoryStats = await Promise.all(
      categories.map(async (category) => {
        const count = await MenuItem.countDocuments({ category });
        return {
          name: category,
          count: count,
          displayName: category.charAt(0).toUpperCase() + category.slice(1) // Capitalize first letter
        };
      })
    );

    res.json({
      success: true,
      message: 'Categories retrieved successfully',
      data: {
        categories: categoryStats,
        total: categories.length
      }
    });
  } catch (error) {
    next(error);
  }
};