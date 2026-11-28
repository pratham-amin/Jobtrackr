
import type { Request, Response, NextFunction } from 'express';
import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import type { AuthRequest } from '../types/custom.js';

import { randomInt } from 'node:crypto';
import { sendVerificationEmail } from '../services/emailService.js';

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

  // Create the user as unverified
  const result = await pool.query(
    `INSERT INTO users
      (name, email, password_hash, email_verified)
     VALUES ($1, $2, $3, FALSE)
     RETURNING id, name, email`,
    [trimmedName, normalizedEmail, hashedPassword]
  );

  const user = result.rows[0];

  // Generate a secure six-digit OTP
  const otp = randomInt(100000, 1000000).toString();

  // Hash the OTP before storing it
  const otpHash = await bcrypt.hash(otp, 10);

  // Store OTP with five-minute expiry
  await pool.query(
    `INSERT INTO email_verifications
      (user_id, otp_hash, expires_at, attempts)
     VALUES ($1, $2, NOW() + INTERVAL '5 minutes', 0)
     ON CONFLICT (user_id)
     DO UPDATE SET
       otp_hash = EXCLUDED.otp_hash,
       expires_at = EXCLUDED.expires_at,
       attempts = 0,
       created_at = NOW()`,
    [user.id, otpHash]
  );

  // Send verification email
  await sendVerificationEmail(normalizedEmail, otp);

  res.status(201).json({
    message: 'Verification code sent to your email.',
    requiresVerification: true,
    email: normalizedEmail,
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
    error: 'Unable to complete registration or send verification email.',
  });
}
}



export async function verifyOtp(
  req: Request,
  res: Response
): Promise<void> {
  const { email, otp } = req.body;

  if (
    typeof email !== 'string' ||
    typeof otp !== 'string' ||
    !email.trim() ||
    !/^\d{6}$/.test(otp)
  ) {
    res.status(400).json({
      error: 'Please provide a valid email and six-digit OTP.',
    });
    return;
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({ error: 'Server configuration error.' });
    return;
  }

  let client;

  try {
    client = await pool.connect();

    await client.query('BEGIN');

    const result = await client.query(
      `SELECT
         u.id,
         u.name,
         u.email,
         ev.otp_hash,
         ev.expires_at,
         ev.attempts
       FROM users u
       JOIN email_verifications ev ON u.id = ev.user_id
       WHERE u.email = $1
         AND u.email_verified = FALSE
       FOR UPDATE OF u, ev`,
      [email.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');

      res.status(400).json({
        error: 'No pending email verification found.',
      });
      return;
    }

    const verification = result.rows[0];

    if (verification.attempts >= 5) {
      await client.query('ROLLBACK');

      res.status(429).json({
        error: 'Too many incorrect attempts. Please request a new OTP.',
      });
      return;
    }

    if (new Date(verification.expires_at) < new Date()) {
      await client.query('ROLLBACK');

      res.status(400).json({
        error: 'OTP has expired. Please request a new one.',
      });
      return;
    }

    const isValid = await bcrypt.compare(
      otp,
      verification.otp_hash
    );

    if (!isValid) {
      await client.query(
        `UPDATE email_verifications
         SET attempts = attempts + 1
         WHERE user_id = $1`,
        [verification.id]
      );

      await client.query('COMMIT');

      res.status(400).json({
        error: 'Incorrect OTP. Please try again.',
      });
      return;
    }

    await client.query(
      `UPDATE users
       SET email_verified = TRUE
       WHERE id = $1`,
      [verification.id]
    );

    await client.query(
      `DELETE FROM email_verifications
       WHERE user_id = $1`,
      [verification.id]
    );

    await client.query('COMMIT');

    const token = jwt.sign(
      { id: verification.id },
      secret,
      { expiresIn: '1h' }
    );

    res.cookie(COOKIE_NAME, token, cookieOptions);

    res.json({
      message: 'Email verified successfully.',
      user: {
        id: verification.id,
        name: verification.name,
        email: verification.email,
      },
    });

  } catch (error) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
    }

    console.error('OTP verification failed:', error);

    res.status(500).json({
      error: 'Unable to verify email.',
    });

  } finally {
    client?.release();
  }
}




export async function resendOtp(
  req: Request,
  res: Response
): Promise<void> {
  const { email } = req.body;

  if (typeof email !== 'string' || !email.trim()) {
    res.status(400).json({ error: 'Email is required.' });
    return;
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    const result = await pool.query(
      `SELECT u.id, ev.created_at
       FROM users u
       JOIN email_verifications ev ON u.id = ev.user_id
       WHERE u.email = $1
         AND u.email_verified = FALSE`,
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      res.status(400).json({
        error: 'No pending email verification found.',
      });
      return;
    }

    const verification = result.rows[0];

    const secondsSinceLastOtp =
      (Date.now() - new Date(verification.created_at).getTime()) / 1000;

    if (secondsSinceLastOtp < 60) {
      res.status(429).json({
        error: 'Please wait 60 seconds before requesting another OTP.',
      });
      return;
    }

    const otp = randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    await pool.query(
      `UPDATE email_verifications
       SET otp_hash = $1,
           expires_at = NOW() + INTERVAL '5 minutes',
           attempts = 0,
           created_at = NOW()
       WHERE user_id = $2`,
      [otpHash, verification.id]
    );

    await sendVerificationEmail(normalizedEmail, otp);

    res.json({
      message: 'A new verification code has been sent.',
    });

  } catch (error) {
    console.error('Resending OTP failed:', error);
    res.status(500).json({
      error: 'Unable to resend verification code.',
    });
  }
}



// Login user

export async function loginUser(
  req: Request,
  res: Response
): Promise<void> {
  const { email, password } = req.body;

  if (
    typeof email !== 'string' ||
    typeof password !== 'string'
  ) {
    res.status(400).json({
      error: 'Email and password are required.',
    });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT id, name, email, password_hash, email_verified
       FROM users
       WHERE email = $1`,
      [email.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        error: 'Invalid email or password.',
      });
      return;
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!match) {
      res.status(401).json({
        error: 'Invalid email or password.',
      });
      return;
    }

    if (!user.email_verified) {
      res.status(403).json({
        error: 'Please verify your email before logging in.',
        requiresVerification: true,
      });
      return;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error('JWT_SECRET is not configured.');

      res.status(500).json({
        error: 'Server configuration error.',
      });
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

    res.status(500).json({
      error: 'Unable to log in.',
    });
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
      name,
      phone,
      skills,
      experience,
      linkedin_url,
      portfolio_url,
    } = req.body;

    if (name !== undefined) {
      const trimmedName = name.trim();

      if (
        trimmedName.length < 2 ||
        trimmedName.length > 60 ||
        !/^[A-Za-z]+([ '-][A-Za-z]+)*$/.test(trimmedName)
      ) {
        res.status(400).json({
          error: 'Name must contain 2–60 characters using letters, spaces, hyphens or apostrophes.',
        });
        return;
      }
    }

    if (
      (name !== undefined && typeof name !== 'string') ||
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
        SET name = COALESCE($1, name),
            phone = $2,
            skills = $3,
            experience = $4,
            linkedin_url = $5,
            portfolio_url = $6
        WHERE id = $7
       RETURNING id, name, email, created_at,
                 phone, skills, experience, linkedin_url, portfolio_url`,
      [
        name?.trim() || undefined ,
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

export async function changePassword(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const userId =
      typeof req.user === 'object' && req.user !== null
        ? req.user.id
        : undefined;

    if (!userId) {
      res.status(401).json({
        error: 'Authentication required.',
      });
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (
      typeof currentPassword !== 'string' ||
      typeof newPassword !== 'string' ||
      typeof confirmPassword !== 'string'
    ) {
      res.status(400).json({
        error: 'Please provide all password fields.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({
        error: 'New passwords do not match.',
      });
      return;
    }

    const passwordPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s])\S{8,64}$/;

    if (!passwordPattern.test(newPassword)) {
      res.status(400).json({
        error: 'Password must be 8–64 characters and include uppercase, lowercase, a number and a special character.',
      });
      return;
    }

    if (currentPassword === newPassword) {
      res.status(400).json({
        error: 'New password must be different from your current password.',
      });
      return;
    }

    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        error: 'User not found.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      result.rows[0].password_hash
    );

    if (!isMatch) {
      res.status(400).json({
        error: 'Current password is incorrect.',
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    res.json({
      message: 'Password changed successfully.',
    });
  } catch (error) {
    console.error('Password change failed:', error);

    res.status(500).json({
      error: 'Unable to change password.',
    });
  }
}