import { Router } from 'express';
import { createCareerRoadmap } from '../controllers/careerController.js';

const router = Router();

router.post('/roadmap', createCareerRoadmap);

export default router;