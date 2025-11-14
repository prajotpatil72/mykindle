import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    filename: {
      type: String,
      required: [true, 'Filename is required'],
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
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
    extractedText: {
      type: String,
      default: '',
    },
    ocrStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collection',
      default: null,
    },
    metadata: {
      uploadDate: {
        type: Date,
        default: Date.now,
      },
      lastOpened: {
        type: Date,
        default: null,
      },
      openCount: {
        type: Number,
        default: 0,
      },
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
documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ filename: 'text', originalName: 'text' });
documentSchema.index({ tags: 1 });
documentSchema.index({ collectionId: 1 });
documentSchema.index({ isDeleted: 1 });

// Method to increment open count
documentSchema.methods.recordOpen = async function () {
  this.metadata.lastOpened = new Date();
  this.metadata.openCount += 1;
  await this.save();
};

const Document = mongoose.model('Document', documentSchema);

export default Document;