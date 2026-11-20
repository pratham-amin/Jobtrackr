import { Router } from 'express';
import { createInterviewPreparation } from '../controllers/interviewController.js';

const router = Router();

router.post('/generate', createInterviewPreparation);

export default router;