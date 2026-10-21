import type { Response } from 'express';
import pool from '../config/db.js';
import type { AuthRequest } from '../types/custom.js';

// Add a new application
export async function addApplication(req: AuthRequest, res: Response): Promise<void> {
  const { company, role, status } = req.body;
  try {
    const userId = typeof req.user === 'string' ? req.user : (req.user as any).id;
    const result = await pool.query(
      'INSERT INTO applications (user_id, company, role, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, company, role, status]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// Get all applications
export async function getApplications(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = typeof req.user === 'string' ? req.user : (req.user as any).id;
    const result = await pool.query(
      'SELECT * FROM applications WHERE user_id=$1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// Update application
export async function updateApplication(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { company, role, status } = req.body;
  try {
    const userId = typeof req.user === 'string' ? req.user : (req.user as any).id;
    const result = await pool.query(
      'UPDATE applications SET company=$1, role=$2, status=$3, updated_at=NOW() WHERE id=$4 AND user_id=$5 RETURNING *',
      [company, role, status, id, userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err: any) {
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
