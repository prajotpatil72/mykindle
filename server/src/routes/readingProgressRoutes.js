import express from 'express';
import {
  getReadingProgress,
  updateReadingProgress,
  getAllReadingProgress,
} from '../controllers/readingProgressController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/', getAllReadingProgress);
router.get('/:documentId', getReadingProgress);
router.put('/:documentId', updateReadingProgress);

export default router;