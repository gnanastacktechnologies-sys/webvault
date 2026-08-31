import mongoose from 'mongoose';

const urlValidator = (val) => {
  try {
    const url = new URL(val);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (err) {
    return false;
  }
};

const websiteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Website name is required'],
      trim: true,
    },
    url: {
      type: String,
      required: [true, 'Website URL is required'],
      validate: {
        validator: urlValidator,
        message: 'Please provide a valid HTTP or HTTPS URL',
      },
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    description: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
    },
    favorite: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster sorting, filtering, and searching
websiteSchema.index({ url: 1 });
websiteSchema.index({ name: 1 });
websiteSchema.index({ category: 1 });
websiteSchema.index({ favorite: 1 });
websiteSchema.index({ createdAt: -1 });

const Website = mongoose.model('Website', websiteSchema);

export default Website;
