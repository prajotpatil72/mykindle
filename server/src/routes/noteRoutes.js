import express from 'express';
import {
  createNote,
  getNotesByDocument,
  updateNote,
  deleteNote,
} from '../controllers/noteController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createNote);
router.get('/:documentId', getNotesByDocument);
router.put('/:noteId', updateNote);
router.delete('/:noteId', deleteNote);

export default router;