import Category from '../models/Category.js';
import Website from '../models/Website.js';

// @desc    Get all categories with website counts
// @route   GET /api/categories
// @access  Private
export const getCategories = async (req, res, next) => {
  try {
    // Aggregate to fetch categories along with their associated website count
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: 'websites',
          localField: '_id',
          foreignField: 'category',
          as: 'websites',
        },
      },
      {
        $project: {
          name: 1,
          description: 1,
          icon: 1,
          color: 1,
          createdAt: 1,
          updatedAt: 1,
          websiteCount: { $size: '$websites' },
        },
      },
      {
        $sort: { name: 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single category details
// @route   GET /api/categories/:id
// @access  Private
export const getCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Get count of websites
    const websiteCount = await Website.countDocuments({ category: category._id });

    res.status(200).json({
      success: true,
      data: {
        ...category.toObject(),
        websiteCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private
export const createCategory = async (req, res, next) => {
  try {
    const { name, description, icon, color } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
      });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ name: { $regex: `^${name.trim()}$`, $options: 'i' } });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists',
      });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      icon: icon || 'FaFolder',
      color: color || '#4F46E5',
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
export const updateCategory = async (req, res, next) => {
  try {
    const { name, description, icon, color } = req.body;

    let category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    if (name && name.trim() !== category.name) {
      // Check for duplicate names
      const existingCategory = await Category.findOne({ name: { $regex: `^${name.trim()}$`, $options: 'i' } });
      if (existingCategory && existingCategory._id.toString() !== category._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Category name already exists',
        });
      }
      category.name = name.trim();
    }

    if (description !== undefined) category.description = description.trim();
    if (icon !== undefined) category.icon = icon;
    if (color !== undefined) category.color = color;

    const updatedCategory = await category.save();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Check if category contains websites
    const websiteCount = await Website.countDocuments({ category: category._id });
    if (websiteCount > 0) {
      return res.status(400).json({
        success: false,
        message: `This category contains ${websiteCount} website${websiteCount === 1 ? '' : 's'}. Please move or delete those websites before deleting this category.`,
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
