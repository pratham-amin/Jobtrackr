import { Router } from 'express';
import {
  createCoverLetter,
  getCoverLetterHistory,
  deleteCoverLetterHistory
} from '../controllers/aiController.js';
import { authMiddleware } from '../controllers/authController.js';

const router = Router();

router.post(
  '/cover-letter',
  authMiddleware,
  createCoverLetter
);

router.get(
  '/cover-letter/history',
  authMiddleware,
  getCoverLetterHistory
);

router.delete(
  '/cover-letter/history/:id',
  authMiddleware,
  deleteCoverLetterHistory
);

export default router;