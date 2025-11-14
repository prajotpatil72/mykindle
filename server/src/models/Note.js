import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
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
    pageNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      default: '#fbbf24', // yellow
      enum: ['#fbbf24', '#60a5fa', '#34d399', '#f87171', '#a78bfa', '#fb923c'],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
noteSchema.index({ userId: 1, documentId: 1, isDeleted: 1 });
noteSchema.index({ documentId: 1, pageNumber: 1 });

export default mongoose.model('Note', noteSchema);