import express from 'express';
import {
  createCollection,
  getCollections,
  getCollection,
  updateCollection,
  deleteCollection,
  reorderCollections,
} from '../controllers/collectionController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Reorder collections
router.put('/reorder', reorderCollections);

// CRUD operations
router.post('/', createCollection);
router.get('/', getCollections);
router.get('/:id', getCollection);
router.put('/:id', updateCollection);
router.delete('/:id', deleteCollection);

export default router;