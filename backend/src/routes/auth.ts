import express, { Router } from 'express';
import { registerUser, loginUser, logoutUser, getCurrentUser,authMiddleware } from '../controllers/authController.js';

const router: Router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', authMiddleware, getCurrentUser);

export default router;
