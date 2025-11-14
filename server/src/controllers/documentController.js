import Document from '../models/Document.js';
import { uploadToSupabase, deleteFromSupabase, getSignedUrl } from '../utils/supabaseStorage.js';
import { extractPDFMetadata, generatePDFThumbnail, formatFileSize } from '../utils/fileUtils.js';
import { processDocumentText } from '../utils/textExtraction.js';

import mongoose from 'mongoose';

// @desc    Upload document
// @route   POST /api/documents/upload
// @access  Private
export const uploadDocument = async (req, res) => {
  try {
    const userId = req.user.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded',
      });
    }

    // Extract PDF metadata
    const metadata = await extractPDFMetadata(file.buffer);

    if (!metadata.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid PDF file',
      });
    }

    // Upload to Supabase
    const uploadResult = await uploadToSupabase(file, userId);

    if (!uploadResult.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to upload file to storage',
        error: uploadResult.error,
      });
    }

    // Process text extraction
    const textResult = await processDocumentText(file.buffer);

    // Create document record in MongoDB
    const document = await Document.create({
      userId,
      filename: uploadResult.path.split('/').pop(),
      originalName: file.originalname,
      fileUrl: uploadResult.fullPath,
      fileSize: file.size,
      mimeType: file.mimetype,
      pageCount: metadata.pageCount,
      extractedText: textResult.extractedText,
      hasText: textResult.hasText,
      textExtractionStatus: textResult.textExtractionStatus,
      ocrStatus: textResult.ocrStatus,
      metadata: {
        uploadDate: new Date(),
      },
    });

    // Generate thumbnail (async, don't wait)
    generatePDFThumbnail(file.buffer)
      .then(async (thumbnail) => {
        if (thumbnail.success) {
          document.thumbnail = thumbnail.path;
          await document.save();
        }
      })
      .catch((err) => console.error('Thumbnail generation failed:', err));

    res.status(201).json({
      status: 'success',
      message: 'Document uploaded successfully',
      data: {
        document: {
          id: document._id,
          filename: document.originalName,
          fileSize: formatFileSize(document.fileSize),
          pageCount: document.pageCount,
          hasText: document.hasText,
          needsOCR: textResult.needsOCR,
          uploadDate: document.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Upload document error:', error);

    // Rollback: delete from Supabase if MongoDB fails
    if (req.uploadedFilePath) {
      await deleteFromSupabase(req.uploadedFilePath);
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to upload document',
      error: error.message,
    });
  }
};

// @desc    Get all documents with advanced filtering
// @route   GET /api/documents
// @access  Private
export const getDocuments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      page = 1,
      limit = 20,
      sort = '-createdAt',
      search,
      collectionId,
      tags,
      dateFrom,
      dateTo,
      minSize,
      maxSize,
      minPages,
      maxPages,
    } = req.query;

    // Build query
    const query = { userId, isDeleted: false };

    // Search by name
    if (search) {
      query.$or = [
        { filename: { $regex: search, $options: 'i' } },
        { originalName: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by collection
    if (collectionId) {
      query.collectionId = collectionId === 'null' ? null : collectionId;
    }

    // Filter by tags
    if (tags) {
      query.tags = { $in: tags.split(',') };
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Filter by file size
    if (minSize || maxSize) {
      query.fileSize = {};
      if (minSize) query.fileSize.$gte = parseInt(minSize);
      if (maxSize) query.fileSize.$lte = parseInt(maxSize);
    }

    // Filter by page count
    if (minPages || maxPages) {
      query.pageCount = {};
      if (minPages) query.pageCount.$gte = parseInt(minPages);
      if (maxPages) query.pageCount.$lte = parseInt(maxPages);
    }

    // Execute query with pagination
    const documents = await Document.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-extractedText')
      .lean();

    const count = await Document.countDocuments(query);

    // Get signed URLs for documents
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        const urlResult = await getSignedUrl(doc.fileUrl, 3600);
        return {
          ...doc,
          signedUrl: urlResult.success ? urlResult.signedUrl : null,
          fileSize: formatFileSize(doc.fileSize),
        };
      })
    );

    res.status(200).json({
      status: 'success',
      data: {
        documents: documentsWithUrls,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalDocuments: count,
      },
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch documents',
    });
  }
};

// @desc    Search documents
// @route   GET /api/documents/search
// @access  Private
export const searchDocuments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query is required',
      });
    }

    // Text search
    const documents = await Document.find({
      userId,
      isDeleted: false,
      $text: { $search: q },
    })
      .select('originalName pageCount fileSize tags createdAt')
      .limit(limit * 1)
      .lean();

    res.status(200).json({
      status: 'success',
      data: {
        documents: documents.map((doc) => ({
          ...doc,
          fileSize: formatFileSize(doc.fileSize),
        })),
        count: documents.length,
      },
    });
  } catch (error) {
    console.error('Search documents error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to search documents',
    });
  }
};

// @desc    Get single document
// @route   GET /api/documents/:id
// @access  Private
export const getDocument = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const document = await Document.findOne({
      _id: id,
      userId,
      isDeleted: false,
    });

    if (!document) {
      return res.status(404).json({
        status: 'error',
        message: 'Document not found',
      });
    }

    // Get signed URL
    const urlResult = await getSignedUrl(document.fileUrl, 3600);

    // Record document open
    await document.recordOpen();

    res.status(200).json({
      status: 'success',
      data: {
        document: {
          id: document._id,
          filename: document.originalName,
          fileSize: formatFileSize(document.fileSize),
          pageCount: document.pageCount,
          tags: document.tags,
          collectionId: document.collectionId,
          signedUrl: urlResult.success ? urlResult.signedUrl : null,
          metadata: document.metadata,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch document',
    });
  }
};

// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Private
export const updateDocument = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { originalName, tags, collectionId } = req.body;

    const document = await Document.findOne({
      _id: id,
      userId,
      isDeleted: false,
    });

    if (!document) {
      return res.status(404).json({
        status: 'error',
        message: 'Document not found',
      });
    }

    // Update fields
    if (originalName) document.originalName = originalName;
    if (tags !== undefined) document.tags = tags;
    if (collectionId !== undefined) document.collectionId = collectionId;

    await document.save();

    res.status(200).json({
      status: 'success',
      message: 'Document updated successfully',
      data: {
        document: {
          id: document._id,
          filename: document.originalName,
          tags: document.tags,
          collectionId: document.collectionId,
        },
      },
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update document',
    });
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
export const deleteDocument = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const document = await Document.findOne({
      _id: id,
      userId,
      isDeleted: false,
    });

    if (!document) {
      return res.status(404).json({
        status: 'error',
        message: 'Document not found',
      });
    }

    // Soft delete
    document.isDeleted = true;
    await document.save();

    // Delete from Supabase (async, don't wait)
    deleteFromSupabase(document.fileUrl)
      .then(() => console.log('File deleted from storage'))
      .catch((err) => console.error('Failed to delete from storage:', err));

    res.status(200).json({
      status: 'success',
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete document',
    });
  }
};

// @desc    Bulk delete documents
// @route   POST /api/documents/bulk-delete
// @access  Private
export const bulkDeleteDocuments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { documentIds } = req.body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Document IDs array is required',
      });
    }

    // Validate all IDs are valid ObjectIds
    const validIds = documentIds.filter((id) => mongoose.Types.ObjectId.isValid(id));

    if (validIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No valid document IDs provided',
      });
    }

    // Find documents
    const documents = await Document.find({
      _id: { $in: validIds },
      userId,
      isDeleted: false,
    });

    if (documents.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No documents found',
      });
    }

    // Soft delete all
    await Document.updateMany(
      {
        _id: { $in: documents.map((d) => d._id) },
        userId,
      },
      {
        $set: { isDeleted: true },
      }
    );

    // Delete from Supabase (async)
    documents.forEach((doc) => {
      deleteFromSupabase(doc.fileUrl).catch((err) =>
        console.error('Failed to delete from storage:', err)
      );
    });

    res.status(200).json({
      status: 'success',
      message: `${documents.length} document(s) deleted successfully`,
      data: {
        deletedCount: documents.length,
      },
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete documents',
    });
  }
};

// @desc    Bulk update documents
// @route   POST /api/documents/bulk-update
// @access  Private
export const bulkUpdateDocuments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { documentIds, updates } = req.body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Document IDs array is required',
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Updates object is required',
      });
    }

    // Validate allowed fields
    const allowedFields = ['tags', 'collectionId'];
    const updateFields = {};

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateFields[key] = updates[key];
      }
    });

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No valid update fields provided',
      });
    }

    // Validate IDs
    const validIds = documentIds.filter((id) => mongoose.Types.ObjectId.isValid(id));

    // Update documents
    const result = await Document.updateMany(
      {
        _id: { $in: validIds },
        userId,
        isDeleted: false,
      },
      {
        $set: updateFields,
      }
    );

    res.status(200).json({
      status: 'success',
      message: `${result.modifiedCount} document(s) updated successfully`,
      data: {
        updatedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update documents',
    });
  }
};

// @desc    Bulk move documents to collection
// @route   POST /api/documents/bulk-move
// @access  Private
export const bulkMoveDocuments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { documentIds, collectionId } = req.body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Document IDs array is required',
      });
    }

    // Validate IDs
    const validIds = documentIds.filter((id) => mongoose.Types.ObjectId.isValid(id));

    // Update documents
    const result = await Document.updateMany(
      {
        _id: { $in: validIds },
        userId,
        isDeleted: false,
      },
      {
        $set: { collectionId: collectionId || null },
      }
    );

    res.status(200).json({
      status: 'success',
      message: `${result.modifiedCount} document(s) moved successfully`,
      data: {
        movedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error('Bulk move error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to move documents',
    });
  }
};

// @desc    Get document statistics
// @route   GET /api/documents/stats
// @access  Private
export const getDocumentStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Basic stats
    const stats = await Document.aggregate([
      { $match: { userId, isDeleted: false } },
      {
        $group: {
          _id: null,
          totalDocuments: { $sum: 1 },
          totalSize: { $sum: '$fileSize' },
          totalPages: { $sum: '$pageCount' },
          avgPageCount: { $avg: '$pageCount' },
          avgFileSize: { $avg: '$fileSize' },
        },
      },
    ]);

    // Stats by collection
    const collectionStats = await Document.aggregate([
      { $match: { userId, isDeleted: false } },
      {
        $group: {
          _id: '$collectionId',
          count: { $sum: 1 },
          totalSize: { $sum: '$fileSize' },
        },
      },
    ]);

    // Most used tags
    const tagStats = await Document.aggregate([
      { $match: { userId, isDeleted: false } },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUploads = await Document.countDocuments({
      userId,
      isDeleted: false,
      createdAt: { $gte: thirtyDaysAgo },
    });

    const result = stats[0] || {
      totalDocuments: 0,
      totalSize: 0,
      totalPages: 0,
      avgPageCount: 0,
      avgFileSize: 0,
    };

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          totalDocuments: result.totalDocuments,
          totalSize: formatFileSize(result.totalSize),
          totalSizeBytes: result.totalSize,
          totalPages: result.totalPages,
          avgPageCount: Math.round(result.avgPageCount),
          avgFileSize: formatFileSize(result.avgFileSize),
          recentUploads,
          collectionStats,
          topTags: tagStats,
        },
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch statistics',
    });
  }
};

// @desc    Get recently opened documents
// @route   GET /api/documents/recent
// @access  Private
export const getRecentDocuments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 10 } = req.query;

    const documents = await Document.find({
      userId,
      isDeleted: false,
      'metadata.lastOpened': { $ne: null },
    })
      .sort({ 'metadata.lastOpened': -1 })
      .limit(limit * 1)
      .select('originalName pageCount fileSize metadata.lastOpened metadata.openCount')
      .lean();

    res.status(200).json({
      status: 'success',
      data: {
        documents: documents.map((doc) => ({
          ...doc,
          fileSize: formatFileSize(doc.fileSize),
        })),
      },
    });
  } catch (error) {
    console.error('Get recent documents error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch recent documents',
    });
  }
};