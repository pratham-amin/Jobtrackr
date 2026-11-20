import { Router } from 'express';
import { evaluateMockAnswer } from '../controllers/mockinterviewController.js';

const router = Router();

router.post('/evaluate', evaluateMockAnswer);

export default router;