
import nodemailer from 'nodemailer';

export async function sendVerificationEmail(
  email: string,
  otp: string
): Promise<void> {
  const gmailUser = process.env.SMTP_USER;
  const appPassword = process.env.SMTP_APP_PASSWORD;
  const fromEmail = process.env.EMAIL_FROM;

  if (!gmailUser || !appPassword || !fromEmail) {
    throw new Error('Gmail SMTP is not configured.');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: appPassword.replace(/\s/g, ''),
    },
  });

  await transporter.sendMail({
    from: `"JobTrackr" <${fromEmail}>`,
    to: email,
    subject: 'Verify your JobTrackr email',
    text: `Your JobTrackr verification code is ${otp}. It expires in 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
        <h2>Welcome to JobTrackr!</h2>
        <p>Use the verification code below to verify your email address.</p>
        <h1 style="letter-spacing: 8px;">${otp}</h1>
        <p>This code expires in 5 minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
}
