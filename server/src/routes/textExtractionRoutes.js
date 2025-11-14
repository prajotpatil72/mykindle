import express from 'express';
import {
  extractText,
  performDocumentOCR,
  getExtractionStatus,
  searchDocumentText,
} from '../controllers/textExtractionController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.post('/:documentId/extract', extractText);
router.post('/:documentId/ocr', performDocumentOCR);
router.get('/:documentId/status', getExtractionStatus);
router.get('/:documentId/search', searchDocumentText);

export default router;