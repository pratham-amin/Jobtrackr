import type { Response } from 'express';
import { randomUUID } from 'node:crypto';
import pool from '../config/db.js';
import type { AuthRequest } from '../types/custom.js';
import { generateFollowUpEmail } from '../services/openaiService.js';
import { sendFollowUpEmail } from '../services/emailService.js';

export async function generateFollowUpEmailController(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const {
    name,
    jobTitle,
    company,
    recruiterName,
    situation,
    additionalContext,
    tone,
  } = req.body;

  if (
    typeof name !== 'string' ||
    typeof jobTitle !== 'string' ||
    typeof company !== 'string' ||
    typeof situation !== 'string'
  ) {
    res.status(400).json({
      error: 'Name, job title, company and situation are required.',
    });
    return;
  }

  const selectedTone = tone ?? 'professional';

  if (!['professional', 'friendly', 'confident'].includes(selectedTone)) {
    res.status(400).json({ error: 'Invalid email tone.' });
    return;
  }
  const userId =
  typeof req.user === 'string' ? req.user : (req.user as any).id;

  const requestId = randomUUID();

  try {
    const result = await generateFollowUpEmail(
      name.trim(),
      jobTitle.trim(),
      company.trim(),
      typeof recruiterName === 'string' ? recruiterName.trim() : '',
      situation.trim(),
      typeof additionalContext === 'string'
        ? additionalContext.trim()
        : '',
      selectedTone as 'professional' | 'friendly' | 'confident'
    );

    await pool.query(
    `INSERT INTO ai_followup_email_sends
 (user_id, request_id, status, subject, message,
  candidate_name, job_title, company, recruiter_name,
  situation, additional_context, tone)
 VALUES ($1, $2, 'generated', $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
[
  userId,
  requestId,
  result.subject,
  result.body,
  name,
  jobTitle,
  company,
  recruiterName || null,
  situation,
  additionalContext || null,
  tone,
]
  );

  res.status(200).json({
    ...result,
    requestId,
  });
  } catch (error) {
    console.error('Follow-up email generation error:', error);

    res.status(500).json({
      error: 'Unable to generate the follow-up email.',
    });
  }
}

export async function sendFollowUpEmailController(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { requestId, recipientEmail, subject, message } = req.body;

  if (
    typeof requestId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId) ||
    typeof recipientEmail !== 'string' ||
    typeof subject !== 'string' ||
    typeof message !== 'string' ||
    !recipientEmail.trim() ||
    !subject.trim() ||
    !message.trim()
  ) {
    res.status(400).json({
      error: 'Recipient email, subject and message are required.',
    });
    return;
  }

  const userId =
  typeof req.user === 'string' ? req.user : (req.user as any).id;
  let emailSent = false;

  try {
        const reservation = await pool.query(
        `UPDATE ai_followup_email_sends
        SET status = 'sending'
        WHERE user_id = $1
          AND request_id = $2
          AND status = 'generated'
        RETURNING id`,
        [userId, requestId]
      );

      if (reservation.rows.length === 0) {
        res.status(409).json({
          error: 'This email has already been sent or is currently being processed.',
        });
        return;
      }

    if (reservation.rows.length === 0) {
      res.status(409).json({
        error: 'This email has already been sent or is currently being processed.',
      });
      return;
    }

    await sendFollowUpEmail(
      recipientEmail.trim(),
      subject.trim(),
      message.trim()
    );

    emailSent = true;

        await pool.query(
  `UPDATE ai_followup_email_sends
   SET status = 'sent',
       recipient_email = $3,
       subject = $4,
       message = $5,
       sent_at = NOW()
   WHERE user_id = $1 AND request_id = $2`,
  [userId, requestId, recipientEmail.trim(), subject.trim(), message.trim()]
);

    res.status(200).json({
      message: 'Follow-up email sent successfully.',
    });
  } catch (error) {
        if (!emailSent) {
          await pool.query(
            `UPDATE ai_followup_email_sends
            SET status = 'generated'
            WHERE user_id = $1
              AND request_id = $2
              AND status = 'sending'`,
            [userId, requestId]
          ).catch((updateError) => {
            console.error('Failed to reset email status:', updateError);
          });
        }

    console.error('Follow-up email sending error:', error);

    res.status(500).json({
      error: 'Unable to send the follow-up email.',
    });
  }
}

export async function getFollowUpEmailHistory(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const userId =
    typeof req.user === 'string' ? req.user : (req.user as any).id;

  try {
    const result = await pool.query(
      `SELECT
         id,
         request_id,
         recipient_email,
         subject,
         message,
         status,
         created_at,
         sent_at,
         candidate_name,
        job_title,
        company,
        recruiter_name,
        situation,
        additional_context,
        tone
       FROM ai_followup_email_sends
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Follow-up email history error:', error);

    res.status(500).json({
      error: 'Unable to retrieve follow-up email history.',
    });
  }
}