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
        (user_id, company, role, status, application_date, job_url, description, notes, follow_up_date, follow_up_status)
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          CASE
            WHEN $4::varchar = 'Applied' AND $5::date IS NOT NULL
            THEN $5::date + 7
            ELSE NULL
          END,
          CASE
            WHEN $4::varchar = 'Applied' THEN 'Pending'
            ELSE 'Not Required'
          END
        )
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
  notes,
  TO_CHAR(follow_up_date, 'YYYY-MM-DD') AS follow_up_date,
  follow_up_status,
  TO_CHAR(last_follow_up_at, 'YYYY-MM-DD HH12:MI AM') AS last_follow_up_at
  
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
  notes,
  TO_CHAR(follow_up_date, 'YYYY-MM-DD') AS follow_up_date,
  follow_up_status,
  TO_CHAR(last_follow_up_at, 'YYYY-MM-DD HH12:MI AM') AS last_follow_up_at
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
           status = $3::varchar,
           application_date = $4::date,
           job_url = $5,
           description = $6,
           notes = $7,
           follow_up_date = CASE
              WHEN $3::varchar = 'Applied' AND $4::date IS NOT NULL
                  AND (status <> 'Applied' OR application_date IS DISTINCT FROM $4::date)
              THEN $4::date + 7
              WHEN $3 = 'Applied' AND $4 IS NOT NULL
              THEN follow_up_date
              ELSE NULL
            END,

            follow_up_status = CASE
              WHEN $3::varchar = 'Applied' AND $4::date IS NOT NULL
                  AND (status <> 'Applied' OR application_date IS DISTINCT FROM $4::date)
              THEN 'Pending'
              WHEN $3 = 'Applied' AND $4 IS NOT NULL
              THEN follow_up_status
              ELSE 'Not Required'
            END,

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


// Mark application follow-up as sent

export async function markFollowUpSent(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;

  try {
    const userId =
      typeof req.user === 'string'
        ? req.user
        : (req.user as any).id;

    const result = await pool.query(
      `UPDATE applications
       SET follow_up_status = 'Sent',
           last_follow_up_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
         AND user_id = $2
         AND follow_up_status = 'Pending'
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        error: 'Pending follow-up not found.',
      });
      return;
    }

    res.json({
      message: 'Follow-up marked as sent.',
      application: result.rows[0],
    });
  } catch (err: any) {
    console.error('Mark follow-up error:', err);
    res.status(500).json({
      error: 'Unable to update follow-up status.',
    });
  }
}



export async function getDueFollowUps(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const userId =
      typeof req.user === 'string'
        ? req.user
        : (req.user as any).id;

    const result = await pool.query(
      `SELECT
         id,
         company,
         role,
         status,
         application_date,
         follow_up_date,
         follow_up_status,
         job_url,
         notes
       FROM applications
       WHERE user_id = $1
         AND follow_up_status = 'Pending'
         AND follow_up_date <= CURRENT_DATE
         AND status = 'Applied'
       ORDER BY follow_up_date ASC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err: any) {
    console.error('Get due follow-ups error:', err);

    res.status(500).json({
      error: 'Unable to retrieve due follow-ups.',
    });
  }
}
