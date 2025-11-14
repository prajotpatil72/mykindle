import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Collection name is required'],
      trim: true,
      maxlength: [100, 'Collection name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    color: {
      type: String,
      default: '#4f46e5',
      match: [/^#[0-9A-F]{6}$/i, 'Please provide a valid hex color'],
    },
    icon: {
      type: String,
      default: '📁',
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collection',
      default: null,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
collectionSchema.index({ userId: 1, order: 1 });
collectionSchema.index({ userId: 1, parentId: 1 });

// Virtual for document count
collectionSchema.virtual('documentCount', {
  ref: 'Document',
  localField: '_id',
  foreignField: 'collectionId',
  count: true,
});

// Method to get full path
collectionSchema.methods.getFullPath = async function () {
  const path = [this.name];
  let current = this;

  while (current.parentId) {
    current = await this.model('Collection').findById(current.parentId);
    if (current) {
      path.unshift(current.name);
    } else {
      break;
    }
  }

  return path.join(' / ');
};

const Collection = mongoose.model('Collection', collectionSchema);

export default Collection;