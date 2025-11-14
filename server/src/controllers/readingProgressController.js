import ReadingProgress from '../models/ReadingProgress.js';
import Document from '../models/Document.js';

// @desc    Get reading progress for a document
// @route   GET /api/reading-progress/:documentId
// @access  Private
export const getReadingProgress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { documentId } = req.params;

    let progress = await ReadingProgress.findOne({ userId, documentId });

    if (!progress) {
      // Return default progress if not found
      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({
          status: 'error',
          message: 'Document not found',
        });
      }

      return res.status(200).json({
        status: 'success',
        data: {
          progress: {
            currentPage: 1,
            totalPages: document.pageCount,
            progress: 0,
            zoom: 1.0,
            viewMode: 'continuous',
          },
        },
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        progress,
      },
    });
  } catch (error) {
    console.error('Get reading progress error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get reading progress',
    });
  }
};

// @desc    Update reading progress
// @route   PUT /api/reading-progress/:documentId
// @access  Private
export const updateReadingProgress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { documentId } = req.params;
    const { currentPage, totalPages, zoom, viewMode } = req.body;

    // Calculate progress percentage
    const progressPercentage = totalPages > 0 
      ? Math.round((currentPage / totalPages) * 100) 
      : 0;

    const progress = await ReadingProgress.findOneAndUpdate(
      { userId, documentId },
      {
        currentPage,
        totalPages,
        progress: progressPercentage,
        zoom: zoom || 1.0,
        viewMode: viewMode || 'continuous',
        lastReadAt: new Date(),
      },
      {
        new: true,
        upsert: true,
      }
    );

    // Update document's last opened time
    await Document.findByIdAndUpdate(documentId, {
      'metadata.lastOpened': new Date(),
    });

    res.status(200).json({
      status: 'success',
      data: {
        progress,
      },
    });
  } catch (error) {
    console.error('Update reading progress error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update reading progress',
    });
  }
};

// @desc    Get all reading progress for user
// @route   GET /api/reading-progress
// @access  Private
export const getAllReadingProgress = async (req, res) => {
  try {
    const userId = req.user.userId;

    const progressList = await ReadingProgress.find({ userId })
      .populate('documentId', 'originalName pageCount fileSize')
      .sort({ lastReadAt: -1 })
      .limit(20);

    res.status(200).json({
      status: 'success',
      data: {
        progressList,
      },
    });
  } catch (error) {
    console.error('Get all reading progress error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get reading progress',
    });
  }
};