import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Tag name is required'],
      trim: true,
      lowercase: true,
      maxlength: [50, 'Tag name cannot exceed 50 characters'],
    },
    color: {
      type: String,
      default: '#6b7280',
      match: [/^#[0-9A-F]{6}$/i, 'Please provide a valid hex color'],
    },
    useCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate tags per user
tagSchema.index({ userId: 1, name: 1 }, { unique: true });
tagSchema.index({ userId: 1, useCount: -1 });

// Method to increment use count
tagSchema.methods.incrementUse = async function () {
  this.useCount += 1;
  await this.save();
};

// Method to decrement use count
tagSchema.methods.decrementUse = async function () {
  if (this.useCount > 0) {
    this.useCount -= 1;
    await this.save();
  }
};

const Tag = mongoose.model('Tag', tagSchema);

export default Tag;