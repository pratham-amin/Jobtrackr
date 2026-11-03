
import { Router } from 'express';
import { createCoverLetter } from '../controllers/aiController.js';
import { authMiddleware } from '../controllers/authController.js';

const router = Router();

router.post(
  '/cover-letter',
  authMiddleware,
  createCoverLetter
);

export default router;
