import express from 'express';
import {
  sendMessage,
  getConversation,
  clearConversation,
} from '../controllers/chatController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

router.post('/:documentId', sendMessage);
router.get('/:documentId', getConversation);
router.delete('/:documentId', clearConversation);

export default router;