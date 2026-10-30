import type { Response } from 'express';
import pool from '../config/db.js';
import type { AuthRequest } from '../types/custom.js';

// Add a new application

export async function addApplication(req: AuthRequest, res: Response): Promise<void> {
  const {
    company,
    role,
    status,
    application_date,
    job_url,
    description,
    notes,
  } = req.body;

  try {
    const userId = typeof req.user === "string" ? req.user : (req.user as any).id;

    const result = await pool.query(
      `INSERT INTO applications
       (user_id, company, role, status, application_date, job_url, description, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        company,
        role,
        status,
        application_date || null,
        job_url || null,
        description || null,
        notes || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error("Add application error:", err);
    res.status(500).json({ error: err.message });
  }
}


// Get all applications
export async function getApplications(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = typeof req.user === 'string' ? req.user : (req.user as any).id;
    const result = await pool.query(
      `SELECT
id,
  user_id,
  company,
  role,
  status,
  TO_CHAR(application_date, 'YYYY-MM-DD') AS application_date,

TO_CHAR(
  (created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Australia/Melbourne',
  'DD-MM-YYYY HH12:MI AM'
) AS created_at,

TO_CHAR(
  (updated_at AT TIME ZONE 'UTC') AT TIME ZONE 'Australia/Melbourne',
  'DD-MM-YYYY HH12:MI AM'
) AS updated_at,
  job_url,
  description,
  notes
  
FROM applications
WHERE user_id=$1
ORDER BY created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}


export async function getApplicationById(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;

  try {
    const userId =
      typeof req.user === "string"
        ? req.user
        : (req.user as any).id;

    const result = await pool.query(
      `SELECT
  id,
  user_id,
  company,
  role,
  status,
  TO_CHAR(application_date, 'YYYY-MM-DD') AS application_date,

TO_CHAR(
  (created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Australia/Melbourne',
  'DD-MM-YYYY HH12:MI AM'
) AS created_at,

TO_CHAR(
  (updated_at AT TIME ZONE 'UTC') AT TIME ZONE 'Australia/Melbourne',
  'DD-MM-YYYY HH12:MI AM'
) AS updated_at,
  job_url,
  description,
  notes
FROM applications
WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        error: "Application not found",
      });
      return;
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error("Fetch application error:", err);

    res.status(500).json({
      error: "Unable to retrieve application.",
    });
  }
}


// Update application

export async function updateApplication(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  const {
    company,
    role,
    status,
    application_date,
    job_url,
    description,
    notes,
  } = req.body;

  try {
    const userId = typeof req.user === "string" ? req.user : (req.user as any).id;

    const result = await pool.query(
      `UPDATE applications
       SET company = $1,
           role = $2,
           status = $3,
           application_date = $4,
           job_url = $5,
           description = $6,
           notes = $7,
           updated_at = NOW()
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [
        company,
        role,
        status,
        application_date || null,
        job_url || null,
        description || null,
        notes || null,
        id,
        userId,
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error("Update application error:", err);
    res.status(500).json({ error: err.message });
  }
}


// Delete application
export async function deleteApplication(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const userId = typeof req.user === 'string' ? req.user : (req.user as any).id;
    const result = await pool.query(
      'DELETE FROM applications WHERE id=$1 AND user_id=$2 RETURNING *',
      [id, userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    res.json({ message: 'Application deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
