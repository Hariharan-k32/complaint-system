const nodemailer = require('nodemailer');
const logger = require('./logger');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD }
  });
};

exports.sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to, subject, html, text
    });
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error('Email send failed:', err);
    // Don't throw - email failure shouldn't break the request
  }
};

exports.statusUpdateEmailTemplate = (complaint, newStatus) => ({
  subject: `Complaint Update - ${complaint.ticketId}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a56db; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2>Complaint Status Updated</h2>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
        <p>Dear Citizen,</p>
        <p>Your complaint has been updated.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; background: #f9fafb; font-weight: bold;">Ticket ID</td><td style="padding: 8px;">${complaint.ticketId}</td></tr>
          <tr><td style="padding: 8px; background: #f9fafb; font-weight: bold;">Title</td><td style="padding: 8px;">${complaint.title}</td></tr>
          <tr><td style="padding: 8px; background: #f9fafb; font-weight: bold;">New Status</td><td style="padding: 8px; color: #1a56db; font-weight: bold;">${newStatus}</td></tr>
        </table>
        <p>You can track your complaint status at any time using your Ticket ID.</p>
        <p>Thank you for your patience.</p>
      </div>
    </div>
  `
});
