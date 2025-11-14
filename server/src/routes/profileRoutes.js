import express from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
} from '../controllers/profileController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/', getProfile);
router.put('/', updateProfile);
router.put('/password', changePassword);

export default router;