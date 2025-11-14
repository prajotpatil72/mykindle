import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      default: 'application/pdf',
    },
    pageCount: {
      type: Number,
      default: 0,
    },
    thumbnail: {
      type: String,
      default: null,
    },
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collection',
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    // Text extraction fields
    extractedText: {
      type: String,
      default: null,
    },
    hasText: {
      type: Boolean,
      default: false,
    },
    textExtractionStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    // OCR fields
    ocrText: {
      type: String,
      default: null,
    },
    ocrStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'not_needed'],
      default: 'pending',
    },
    ocrError: {
      type: String,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    metadata: {
      uploadDate: Date,
      lastOpened: Date,
      openCount: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
documentSchema.index({ userId: 1, isDeleted: 1 });
documentSchema.index({ collectionId: 1 });
documentSchema.index({ tags: 1 });
documentSchema.index({ originalName: 'text', extractedText: 'text', ocrText: 'text' });

// Method to record document open
documentSchema.methods.recordOpen = async function () {
  this.metadata.lastOpened = new Date();
  this.metadata.openCount += 1;
  await this.save();
};

export default mongoose.model('Document', documentSchema);