import type { Request, Response, NextFunction } from 'express';
import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import type { AuthRequest } from '../types/custom.js';

// Register user
export async function registerUser(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [name, email, hashed]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error("DB Error:", err);
    res.status(500).json({ error: err.message });
  }
}

// Login user
export async function loginUser(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (result.rows.length === 0) {
      res.status(400).json({ error: 'User not found' });
      return;
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      res.status(400).json({ error: 'Invalid credentials' });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET not set");

    const token = jwt.sign({ id: user.id }, secret, { expiresIn: '1h' });
    res.json({ token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// JWT middleware
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Invalid authorization header' });
    return;
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'JWT_SECRET not set' });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload | string;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
}
