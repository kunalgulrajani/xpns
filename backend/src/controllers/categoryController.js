const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');

// GET /api/categories
exports.list = async (req, res, next) => {
  try {
    const categories = await Category.find({
      $or: [{ isDefault: true }, { user: req.user._id }],
    }).sort('type name');

    res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
};

// POST /api/categories
exports.create = async (req, res, next) => {
  try {
    const { name, type } = req.body;

    const duplicate = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      type,
      $or: [{ user: req.user._id }, { isDefault: true }],
    });
    if (duplicate) throw new ApiError(409, 'Category already exists');

    const category = await Category.create({
      name,
      type,
      user: req.user._id,
      isDefault: false,
    });

    res.status(201).json({ success: true, category });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/categories/:id
exports.remove = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) throw new ApiError(404, 'Category not found');
    if (category.isDefault) throw new ApiError(403, 'Cannot delete default categories');
    if (String(category.user) !== String(req.user._id)) {
      throw new ApiError(403, 'Not authorized');
    }

    await category.deleteOne();
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
};
