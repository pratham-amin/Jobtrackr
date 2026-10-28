
import './config/env.js';

import express, { type Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.js';
import applicationRoutes from './routes/applications.js';

const app: Application = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.get('/test', (_req, res) => {
  res.json({ message: 'Backend is working!' });
});

app.use('/auth', authRoutes);
app.use('/applications', applicationRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
