import express from 'express';
import {
  login,
  getMe,
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  updateProfile,
  createUser,
  getUsers,
  updateUserAccess,
  deleteUser,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/forgot-password/request-otp', requestPasswordResetOtp);
router.post('/forgot-password/verify-otp', verifyPasswordResetOtp);
router.put('/profile', protect, updateProfile);
router.get('/users', protect, getUsers);
router.post('/users', protect, createUser);
router.put('/users/:id/access', protect, updateUserAccess);
router.delete('/users/:id', protect, deleteUser);

export default router;
