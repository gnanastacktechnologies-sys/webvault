import mongoose from 'mongoose';
import Website from '../models/Website.js';
import Category from '../models/Category.js';

// @desc    Get all websites (paginated, sorted, filtered, searched)
// @route   GET /api/websites
// @access  Private
export const getWebsites = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, sort = 'createdAt', order = 'desc', category, favorite } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filter = {};

    if (category) {
      filter.category = new mongoose.Types.ObjectId(category);
    }

    if (favorite !== undefined) {
      filter.favorite = favorite === 'true';
    }

    if (search) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      
      // Find categories matching search term
      const matchedCategories = await Category.find({ name: searchRegex }).select('_id');
      const categoryIds = matchedCategories.map((c) => c._id);

      const orConditions = [
        { name: searchRegex },
        { url: searchRegex },
        { description: searchRegex },
        { notes: searchRegex },
        { tags: searchRegex },
      ];

      if (categoryIds.length > 0) {
        orConditions.push({ category: { $in: categoryIds } });
      }

      filter.$or = orConditions;
    }

    // Build Aggregation Pipeline for sorting by populated Category fields as well as normal fields
    const pipeline = [];

    // Match criteria
    pipeline.push({ $match: filter });

    // Join with Category collection
    pipeline.push({
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'categoryInfo',
      },
    });

    // Unwind Category array (it's a 1-to-1 relationship)
    pipeline.push({
      $unwind: {
        path: '$categoryInfo',
        preserveNullAndEmptyArrays: true, // Safeguard, though category is required
      },
    });

    // Determine sort field and order
    const sortFieldMap = {
      name: 'name',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      favorite: 'favorite',
      category: 'categoryInfo.name', // Sort by category name alphabetically
    };

    const sortField = sortFieldMap[sort] || 'createdAt';
    const sortOrder = order === 'asc' ? 1 : -1;
    pipeline.push({ $sort: { [sortField]: sortOrder } });

    // Project output format (mapping categoryInfo back to category)
    pipeline.push({
      $project: {
        name: 1,
        url: 1,
        description: 1,
        tags: 1,
        notes: 1,
        favorite: 1,
        createdAt: 1,
        updatedAt: 1,
        category: '$categoryInfo',
      },
    });

    // Facet for pagination and total count
    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [{ $skip: skip }, { $limit: limitNum }],
      },
    });

    const result = await Website.aggregate(pipeline);
    const data = result[0].data || [];
    const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;

    res.status(200).json({
      success: true,
      count: data.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single website details
// @route   GET /api/websites/:id
// @access  Private
export const getWebsite = async (req, res, next) => {
  try {
    const website = await Website.findById(req.params.id).populate('category');

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    res.status(200).json({
      success: true,
      data: website,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new website
// @route   POST /api/websites
// @access  Private
export const createWebsite = async (req, res, next) => {
  try {
    const { name, url, category, description, tags, notes, favorite } = req.body;

    if (!name || !url || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, URL, and category are required',
      });
    }

    // Verify duplicate URL
    const trimmedUrl = url.trim().toLowerCase();
    const existingWebsite = await Website.findOne({ url: { $regex: `^${trimmedUrl}$`, $options: 'i' } });
    if (existingWebsite) {
      return res.status(400).json({
        success: false,
        message: 'Website URL already exists',
      });
    }

    // Check if category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Category ID provided',
      });
    }

    const website = await Website.create({
      name: name.trim(),
      url: url.trim(),
      category,
      description: description ? description.trim() : '',
      tags: Array.isArray(tags) ? tags : [],
      notes: notes ? notes.trim() : '',
      favorite: !!favorite,
    });

    const populatedWebsite = await Website.findById(website._id).populate('category');

    res.status(201).json({
      success: true,
      message: 'Website created successfully',
      data: populatedWebsite,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update website
// @route   PUT /api/websites/:id
// @access  Private
export const updateWebsite = async (req, res, next) => {
  try {
    const { name, url, category, description, tags, notes, favorite } = req.body;

    let website = await Website.findById(req.params.id);

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    if (url && url.trim().toLowerCase() !== website.url.toLowerCase()) {
      // Check for URL duplication
      const trimmedUrl = url.trim().toLowerCase();
      const existingWebsite = await Website.findOne({ url: { $regex: `^${trimmedUrl}$`, $options: 'i' } });
      if (existingWebsite && existingWebsite._id.toString() !== website._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Website URL already exists',
        });
      }
      website.url = url.trim();
    }

    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Category ID provided',
        });
      }
      website.category = category;
    }

    if (name) website.name = name.trim();
    if (description !== undefined) website.description = description.trim();
    if (tags !== undefined) website.tags = Array.isArray(tags) ? tags : [];
    if (notes !== undefined) website.notes = notes.trim();
    if (favorite !== undefined) website.favorite = !!favorite;

    await website.save();
    const updatedWebsite = await Website.findById(website._id).populate('category');

    res.status(200).json({
      success: true,
      message: 'Website updated successfully',
      data: updatedWebsite,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete website
// @route   DELETE /api/websites/:id
// @access  Private
export const deleteWebsite = async (req, res, next) => {
  try {
    const website = await Website.findById(req.params.id);

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    await Website.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Website deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle/patch favorite status of website
// @route   PATCH /api/websites/:id/favorite
// @access  Private
export const toggleFavorite = async (req, res, next) => {
  try {
    const website = await Website.findById(req.params.id);

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found',
      });
    }

    website.favorite = !website.favorite;
    await website.save();

    const updatedWebsite = await Website.findById(website._id).populate('category');

    res.status(200).json({
      success: true,
      message: website.favorite ? 'Marked as favorite' : 'Removed from favorites',
      data: updatedWebsite,
    });
  } catch (error) {
    next(error);
  }
};
