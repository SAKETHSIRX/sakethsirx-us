import nodemailer from 'nodemailer';

// Create a reusable transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false, // STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendVerificationCode = async (to, code) => {
  const html = `
    <div style="font-family: Arial, sans-serif; font-size: 16px; color: #111">
      <p>Your verification code is:</p>
      <h2 style="letter-spacing: 4px">${code}</h2>
      <p>This code expires in 10 minutes.</p>
    </div>
  `;

  return transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Your verification code',
    html,
  });
};

export default { sendVerificationCode };