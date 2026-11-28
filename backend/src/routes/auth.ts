import express, { Router } from 'express';

import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateProfile,
  authMiddleware,
  verifyOtp,
  resendOtp,
  changePassword
} from '../controllers/authController.js';

const router: Router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', authMiddleware, getCurrentUser);
router.put('/profile', authMiddleware, updateProfile);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.put('/change-password', authMiddleware, changePassword);

export default router;
