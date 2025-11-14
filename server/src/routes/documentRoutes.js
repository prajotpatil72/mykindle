import express from 'express';
import {
  uploadDocument,
  getDocuments,
  searchDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  bulkDeleteDocuments,
  bulkUpdateDocuments,
  bulkMoveDocuments,
  getDocumentStats,
  getRecentDocuments,
} from '../controllers/documentController.js';
import { protect } from '../middlewares/auth.js';
import upload, { handleMulterError } from '../middlewares/upload.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Upload document
router.post('/upload', upload.single('file'), handleMulterError, uploadDocument);

// Search
router.get('/search', searchDocuments);

// Stats & Recent
router.get('/stats', getDocumentStats);
router.get('/recent', getRecentDocuments);

// Bulk operations
router.post('/bulk-delete', bulkDeleteDocuments);
router.post('/bulk-update', bulkUpdateDocuments);
router.post('/bulk-move', bulkMoveDocuments);

// CRUD operations
router.get('/', getDocuments);
router.get('/:id', getDocument);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);

export default router;