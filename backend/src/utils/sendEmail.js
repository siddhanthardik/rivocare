const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Try to use real SMTP config if available
  const hasSMTPConfig = process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD;
  
  // If no config provided, log to console (helpful for local dev without mailtrap)
  if (!hasSMTPConfig) {
    console.log('\n--- 📧 MOCK EMAIL DISPATCHED ---');
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message:\n${options.message}`);
    console.log('--------------------------------\n');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const message = {
    from: `${process.env.FROM_NAME || 'RIVO'} <${process.env.FROM_EMAIL || 'noreply@rivocare.in'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transporter.sendMail(message);
};

module.exports = sendEmail;
