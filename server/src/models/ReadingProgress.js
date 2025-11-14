import mongoose from 'mongoose';

const readingProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    currentPage: {
      type: Number,
      default: 1,
    },
    totalPages: {
      type: Number,
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    zoom: {
      type: Number,
      default: 1.0,
    },
    viewMode: {
      type: String,
      enum: ['single', 'continuous'],
      default: 'continuous',
    },
    lastReadAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for faster queries
readingProgressSchema.index({ userId: 1, documentId: 1 }, { unique: true });

export default mongoose.model('ReadingProgress', readingProgressSchema);