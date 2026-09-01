import express from 'express';
import {
  login,
  getMe,
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  updateProfile,
  createUser,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/forgot-password/request-otp', requestPasswordResetOtp);
router.post('/forgot-password/verify-otp', verifyPasswordResetOtp);
router.put('/profile', protect, updateProfile);
router.post('/users', protect, createUser);

export default router;
