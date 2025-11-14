import express from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getCurrentUser,
} from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';
import {
  authLimiter,
  passwordResetLimiter,
  registerLimiter,
} from '../middlewares/rateLimiter.js';

const router = express.Router();

// Public routes
router.post('/register', registerLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getCurrentUser);

export default router;