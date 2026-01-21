// utils/mailer.js
import nodemailer from "nodemailer";

// Read env once at module load (after dotenv/config in server.js)
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false, // Mailtrap uses 2525 with STARTTLS (secure: false)
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export async function sendOtpEmail(to, code) {
  const appName = process.env.APP_NAME || "Your App";
  const info = await transporter.sendMail({
    from: `"${appName} Support" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: "Your password reset code",
    text: `Your ${appName} password reset code is: ${code}. It expires in 5 minutes.`,
    html: `<p>Your ${appName} password reset code is:</p>
           <p style="font-size:20px;font-weight:bold;letter-spacing:3px">${code}</p>
           <p>This code expires in <b>5 minutes</b>.</p>`,
  });
  return info;
}