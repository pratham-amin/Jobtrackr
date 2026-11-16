import { Router } from 'express';
import {
  createCoverLetter,
  getCoverLetterHistory,
  deleteCoverLetterHistory,
  updateCoverLetterHistory,
  analyzeResume,
  optimizeResume,
  createFinalResume
} from '../controllers/aiController.js';
import { authMiddleware } from '../controllers/authController.js';
import { uploadResume } from '../middleware/uploadResume.js';

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

router.post(
  '/resume/analyze',
  authMiddleware,
  uploadResume.single('resume'),
  analyzeResume
);

router.post(
  '/resume/optimize',
  authMiddleware,
  uploadResume.single('resume'),
  optimizeResume
);

router.post(
  '/resume/finalize',
  authMiddleware,
  uploadResume.single('resume'),
  createFinalResume
);


export default router;