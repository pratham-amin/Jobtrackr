import express, { Router } from 'express';
import {
  addApplication,
  getApplications,
  updateApplication,
  deleteApplication,
  getApplicationById,
  markFollowUpSent,
  getDueFollowUps
} from '../controllers/applicationsController.js';
import { authMiddleware } from '../controllers/authController.js';

const router: Router = express.Router();

router.post('/', authMiddleware, addApplication);
router.get('/', authMiddleware, getApplications);
router.put('/:id', authMiddleware, updateApplication);
router.delete('/:id', authMiddleware, deleteApplication);
router.get('/:id', authMiddleware, getApplicationById);
router.patch('/:id/follow-up', authMiddleware, markFollowUpSent);
router.get('/follow-ups/due', authMiddleware, getDueFollowUps);

export default router;
