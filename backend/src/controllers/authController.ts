
import type { Request, Response, NextFunction } from 'express';
import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import type { AuthRequest } from '../types/custom.js';

const COOKIE_NAME = 'jobtrackr_token';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 1000,
};

// Register user
export async function registerUser(
  req: Request,
  res: Response
): Promise<void> {
  const { name, email, password } = req.body;

  const namePattern = /^[A-Za-z]+([ '-][A-Za-z]+)*$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s])\S{8,64}$/;

if (
  typeof name !== 'string' ||
  typeof email !== 'string' ||
  typeof password !== 'string'
) {
  res.status(400).json({
    error: 'Please provide valid registration details.',
  });
  return;
}

const trimmedName = name.trim();
const normalizedEmail = email.trim().toLowerCase();

if (
  trimmedName.length < 2 ||
  trimmedName.length > 60 ||
  !namePattern.test(trimmedName)
) {
  res.status(400).json({
    error: 'Name must contain 2–60 characters using letters, spaces, hyphens or apostrophes.',
  });
  return;
}



if (
  normalizedEmail.length > 254 ||
  !emailPattern.test(normalizedEmail)
) {
  res.status(400).json({
    error: 'Please enter a valid email address.',
  });
  return;
}

if (!passwordPattern.test(password)) {
  res.status(400).json({
    error: 'Password must be 8–64 characters and include uppercase, lowercase, a number and a special character.',
  });
  return;
}

// PLACE THE DATABASE REGISTRATION LOGIC HERE
try {
  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at`,
    [trimmedName, normalizedEmail, hashedPassword]
  );

  res.status(201).json({
    message: 'Registration successful.',
    user: result.rows[0],
  });
} catch (err: unknown) {
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    err.code === '23505'
  ) {
    res.status(409).json({
      error: 'An account with this email already exists.',
    });
    return;
  }

  console.error('Registration failed:', err);
  res.status(500).json({
    error: 'Unable to register user.',
  });
}
}




// Login user
export async function loginUser(
  req: Request,
  res: Response
): Promise<void> {
  const { email, password } = req.body;

  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT id, name, email, password_hash
       FROM users
       WHERE email = $1`,
      [email.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error('JWT_SECRET is not configured.');
      res.status(500).json({ error: 'Server configuration error.' });
      return;
    }

    const token = jwt.sign(
      { id: user.id },
      secret,
      { expiresIn: '1h' }
    );

    res.cookie(COOKIE_NAME, token, cookieOptions);

    res.json({
      message: 'Login successful.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err: unknown) {
    console.error('Login failed:', err);
    res.status(500).json({ error: 'Unable to log in.' });
  }
}

// Log out user
export function logoutUser(
  _req: Request,
  res: Response
): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  res.json({ message: 'Logged out successfully.' });
}

// JWT cookie middleware
export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({ error: 'Server configuration error.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload | string;

    if (
      typeof decoded === 'string' ||
      decoded.id === undefined
    ) {
      res.status(401).json({ error: 'Invalid token.' });
      return;
    }

    req.user = decoded;
    next();
  } catch {
    res.status(401).json({
      error: 'Session is invalid or expired. Please log in again.',
    });
  }
}


export async function getCurrentUser(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const userId =
      typeof req.user === 'object' && req.user !== null
        ? req.user.id
        : undefined;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

        const result = await pool.query(
      `SELECT
        id,
        name,
        email,
        created_at,
        phone,
        skills,
        experience,
        linkedin_url,
        portfolio_url
      FROM users
      WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'User not found.' });
      return;
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Failed to retrieve current user:', error);
    res.status(500).json({ error: 'Unable to retrieve user.' });
  }
}

export async function updateProfile(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const userId =
      typeof req.user === 'object' && req.user !== null
        ? req.user.id
        : undefined;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const {
      phone,
      skills,
      experience,
      linkedin_url,
      portfolio_url,
    } = req.body;

    if (
      (phone !== undefined && typeof phone !== 'string') ||
      (skills !== undefined && typeof skills !== 'string') ||
      (experience !== undefined && typeof experience !== 'string') ||
      (linkedin_url !== undefined && typeof linkedin_url !== 'string') ||
      (portfolio_url !== undefined && typeof portfolio_url !== 'string')
    ) {
      res.status(400).json({ error: 'Invalid profile details.' });
      return;
    }

    const result = await pool.query(
      `UPDATE users
       SET phone = $1,
           skills = $2,
           experience = $3,
           linkedin_url = $4,
           portfolio_url = $5
       WHERE id = $6
       RETURNING id, name, email, created_at,
                 phone, skills, experience, linkedin_url, portfolio_url`,
      [
        phone?.trim() || null,
        skills?.trim() || null,
        experience?.trim() || null,
        linkedin_url?.trim() || null,
        portfolio_url?.trim() || null,
        userId,
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({
      message: 'Professional profile updated successfully.',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Profile update failed:', error);
    res.status(500).json({ error: 'Unable to update profile.' });
  }
}