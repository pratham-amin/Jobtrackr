import './config/env.js';

import express from 'express';
import type { Application } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import applicationRoutes from './routes/applications.js';

const app: Application = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/applications', applicationRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
