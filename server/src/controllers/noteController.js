import Note from '../models/Note.js';
import Document from '../models/Document.js';

// @desc    Create a note
// @route   POST /api/notes
// @access  Private
export const createNote = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { documentId, pageNumber, content, color } = req.body;

    // Validate document exists and belongs to user
    const document = await Document.findOne({
      _id: documentId,
      userId,
      isDeleted: false,
    });

    if (!document) {
      return res.status(404).json({
        status: 'error',
        message: 'Document not found',
      });
    }

    // Validate page number
    if (pageNumber < 1 || pageNumber > document.pageCount) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid page number',
      });
    }

    const note = await Note.create({
      userId,
      documentId,
      pageNumber,
      content,
      color: color || '#fbbf24',
    });

    res.status(201).json({
      status: 'success',
      data: { note },
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create note',
    });
  }
};

// @desc    Get notes for a document
// @route   GET /api/notes/:documentId
// @access  Private
export const getNotesByDocument = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { documentId } = req.params;
    const { pageNumber } = req.query;

    const query = {
      userId,
      documentId,
      isDeleted: false,
    };

    if (pageNumber) {
      query.pageNumber = parseInt(pageNumber);
    }

    const notes = await Note.find(query).sort({ pageNumber: 1, createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { notes },
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch notes',
    });
  }
};

// @desc    Update a note
// @route   PUT /api/notes/:noteId
// @access  Private
export const updateNote = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { noteId } = req.params;
    const { content, color } = req.body;

    const note = await Note.findOne({
      _id: noteId,
      userId,
      isDeleted: false,
    });

    if (!note) {
      return res.status(404).json({
        status: 'error',
        message: 'Note not found',
      });
    }

    if (content) note.content = content;
    if (color) note.color = color;

    await note.save();

    res.status(200).json({
      status: 'success',
      data: { note },
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update note',
    });
  }
};

// @desc    Delete a note
// @route   DELETE /api/notes/:noteId
// @access  Private
export const deleteNote = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { noteId } = req.params;

    const note = await Note.findOne({
      _id: noteId,
      userId,
      isDeleted: false,
    });

    if (!note) {
      return res.status(404).json({
        status: 'error',
        message: 'Note not found',
      });
    }

    note.isDeleted = true;
    await note.save();

    res.status(200).json({
      status: 'success',
      message: 'Note deleted successfully',
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete note',
    });
  }
};