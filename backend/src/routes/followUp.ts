import { Router } from 'express';
import { authMiddleware } from '../controllers/authController.js';
import { generateFollowUpEmailController } from '../controllers/followUpController.js';
import { sendFollowUpEmailController } from '../controllers/followUpController.js';
import { getFollowUpEmailHistory } from '../controllers/followUpController.js';

const router = Router();

router.post(
  '/generate',
  authMiddleware,
  generateFollowUpEmailController
);

router.post(
  '/send',
  authMiddleware,
  sendFollowUpEmailController
);

router.get('/history', authMiddleware, getFollowUpEmailHistory);

export default router;