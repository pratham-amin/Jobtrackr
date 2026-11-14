import { Router } from 'express';
import {
  createCoverLetter,
  getCoverLetterHistory,
  deleteCoverLetterHistory,
  updateCoverLetterHistory
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

router.put(
  '/cover-letter/history/:id',
  authMiddleware,
  updateCoverLetterHistory
);

export default router;