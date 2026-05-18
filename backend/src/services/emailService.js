const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_PORT == 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const defaultFrom = process.env.EMAIL_FROM || '"Carely Support" <support@carely.com>';

const sendEmail = async (to, subject, html) => {
  try {
    if (!process.env.EMAIL_USER) {
      console.log(`[Email Mock] To: ${to} | Subject: ${subject}`);
      return;
    }
    await transporter.sendMail({
      from: defaultFrom,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error(`[Email Error] Failed to send email to ${to}:`, err.message);
    // Non-blocking: we swallow the error so caller flows aren't broken
  }
};

const templates = {
  wrap: (content) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.5;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #4F46E5; margin: 0;">Carely</h2>
      </div>
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
        ${content}
      </div>
      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #9ca3af;">
        <p>© ${new Date().getFullYear()} Carely Healthcare. All rights reserved.</p>
        <p>If you need help, contact support@carely.com</p>
      </div>
    </div>
  `,

  welcome: (name) => templates.wrap(`
    <h3 style="margin-top: 0;">Welcome to Carely, ${name}!</h3>
    <p>Thank you for joining our healthcare platform. We are dedicated to providing you with the best care possible.</p>
    <p>You can now book services, request lab tests, and manage your health seamlessly from your dashboard.</p>
  `),

  bookingAccepted: (patientName, providerName, serviceName, date, paymentMethod) => templates.wrap(`
    <h3 style="margin-top: 0;">Booking Confirmed</h3>
    <p>Hi ${patientName},</p>
    <p>Your booking for <strong>${serviceName}</strong> has been accepted by <strong>${providerName}</strong>.</p>
    <ul style="padding-left: 20px;">
      <li><strong>Date/Time:</strong> ${new Date(date).toLocaleString()}</li>
      <li><strong>Payment Method:</strong> ${paymentMethod || 'Not specified'}</li>
    </ul>
    <p>Please log in to your dashboard for more details.</p>
  `),

  providerAssigned: (patientName, providerName, serviceName) => templates.wrap(`
    <h3 style="margin-top: 0;">Provider Assigned</h3>
    <p>Hi ${patientName},</p>
    <p>We have assigned <strong>${providerName}</strong> to your booking for <strong>${serviceName}</strong>.</p>
    <p>Your provider will review the details and confirm shortly.</p>
  `),

  paymentSuccess: (name, amount, bookingId, method) => templates.wrap(`
    <h3 style="margin-top: 0;">Payment Successful</h3>
    <p>Hi ${name},</p>
    <p>We have successfully received your payment of <strong>₹${amount}</strong> for booking #${bookingId.toString().slice(-6).toUpperCase()}.</p>
    <p>Payment Method: ${method}</p>
    <p>Thank you for choosing Carely.</p>
  `),

  codReminder: (name, bookingId) => templates.wrap(`
    <h3 style="margin-top: 0; color: #d97706;">Action Required: Confirm Cash Payment</h3>
    <p>Hi ${name},</p>
    <p>Your provider has marked the cash collection for booking #${bookingId.toString().slice(-6).toUpperCase()} as complete.</p>
    <p><strong>Please log in to your dashboard immediately to confirm the payment.</strong> This is required so we can credit your provider.</p>
    <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/patient/bookings" style="display: inline-block; background: #4F46E5; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Confirm Payment Now</a>
  `),

  bookingCompleted: (name, serviceName) => templates.wrap(`
    <h3 style="margin-top: 0;">Service Completed</h3>
    <p>Hi ${name},</p>
    <p>Your service for <strong>${serviceName}</strong> has been successfully completed.</p>
    <p>We hope you had a great experience with Carely.</p>
  `),

  disputeRaised: (role, bookingId) => templates.wrap(`
    <h3 style="margin-top: 0; color: #dc2626;">Payment Dispute Raised</h3>
    <p>A payment dispute has been raised for booking #${bookingId.toString().slice(-6).toUpperCase()}.</p>
    <p>${role === 'admin' ? 'Please review this in the admin operational dashboard.' : 'Our admin team will review this and resolve it shortly. No further action is needed right now.'}</p>
  `),

  disputeResolved: (name, bookingId, resolution, amount) => templates.wrap(`
    <h3 style="margin-top: 0; color: #059669;">Payment Dispute Resolved</h3>
    <p>Hi ${name},</p>
    <p>The payment dispute for booking #${bookingId.toString().slice(-6).toUpperCase()} has been resolved by our admin team.</p>
    <p><strong>Outcome:</strong> ${resolution}</p>
    ${amount ? `<p><strong>Amount:</strong> ₹${amount}</p>` : ''}
    <p>Please check your dashboard for full details.</p>
  `),

  reviewRequest: (name, providerName, bookingId) => templates.wrap(`
    <h3 style="margin-top: 0;">How was your experience?</h3>
    <p>Hi ${name},</p>
    <p>Your service with <strong>${providerName}</strong> is complete and paid. We would love to hear about your experience!</p>
    <p>Please take a moment to leave a review.</p>
    <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/patient/bookings" style="display: inline-block; background: #4F46E5; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Leave a Review</a>
  `),

  passwordReset: (name, resetUrl) => templates.wrap(`
    <h3 style="margin-top: 0;">Password Reset Request</h3>
    <p>Hi ${name},</p>
    <p>You requested a password reset. Click the button below to reset your password. This link will expire in 10 minutes.</p>
    <a href="${resetUrl}" style="display: inline-block; background: #4F46E5; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Reset Password</a>
    <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">If you did not request this, please ignore this email.</p>
  `),

  onboardingSubmitted: (name) => templates.wrap(`
    <h3 style="margin-top: 0;">Application Submitted!</h3>
    <p>Hi ${name},</p>
    <p>Thank you for completing your onboarding on Carely. Your documents have been submitted and our team will review them within <strong>24 hours</strong>.</p>
    <p>You will receive an email once your profile is verified and activated.</p>
  `),

  adminOnboardingAlert: (providerName) => templates.wrap(`
    <h3 style="margin-top: 0; color: #d97706;">New Provider Verification Required</h3>
    <p>A new provider <strong>${providerName}</strong> has submitted their onboarding documents and is awaiting verification.</p>
    <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/admin/providers/verification" style="display: inline-block; background: #4F46E5; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Review Application</a>
  `),

  verificationApproved: (name) => templates.wrap(`
    <h3 style="margin-top: 0; color: #059669;">You're Verified! Welcome to Carely</h3>
    <p>Hi ${name},</p>
    <p>Congratulations! Your documents have been verified and your provider account is now <strong>Active</strong>.</p>
    <p>You can now log in and start accepting bookings from patients.</p>
    <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/provider" style="display: inline-block; background: #4F46E5; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Go to Dashboard</a>
  `),

  verificationRejected: (name, reason) => templates.wrap(`
    <h3 style="margin-top: 0; color: #dc2626;">Verification Unsuccessful</h3>
    <p>Hi ${name},</p>
    <p>Unfortunately, we could not verify your submitted documents at this time.</p>
    <p><strong>Reason:</strong> ${reason}</p>
    <p>Please log in, update your documents, and resubmit for review.</p>
    <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/provider/onboarding" style="display: inline-block; background: #4F46E5; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Update & Resubmit</a>
  `),
};

module.exports = {
  sendWelcome: (email, name) => sendEmail(email, 'Welcome to Carely!', templates.welcome(name)),
  sendBookingAccepted: (email, pName, provName, sName, date, method) => sendEmail(email, `Booking Confirmed: ${sName}`, templates.bookingAccepted(pName, provName, sName, date, method)),
  sendProviderAssigned: (email, pName, provName, sName) => sendEmail(email, `Provider Assigned for ${sName}`, templates.providerAssigned(pName, provName, sName)),
  sendPaymentSuccess: (email, name, amount, bid, method) => sendEmail(email, 'Payment Successful', templates.paymentSuccess(name, amount, bid, method)),
  sendCodReminder: (email, name, bid) => sendEmail(email, 'Action Required: Confirm Cash Payment', templates.codReminder(name, bid)),
  sendBookingCompleted: (email, name, sName) => sendEmail(email, `Service Completed: ${sName}`, templates.bookingCompleted(name, sName)),
  sendDisputeRaised: (email, role, bid) => sendEmail(email, `Payment Dispute: Booking #${bid.toString().slice(-6).toUpperCase()}`, templates.disputeRaised(role, bid)),
  sendDisputeResolved: (email, name, bid, res, amt) => sendEmail(email, `Dispute Resolved: Booking #${bid.toString().slice(-6).toUpperCase()}`, templates.disputeResolved(name, bid, res, amt)),
  sendReviewRequest: (email, name, provName, bid) => sendEmail(email, 'How was your experience?', templates.reviewRequest(name, provName, bid)),
  sendPasswordReset: (email, name, url) => sendEmail(email, 'Password Reset Request', templates.passwordReset(name, url)),
  sendOnboardingSubmitted: (email, name) => sendEmail(email, 'Application Submitted – Carely', templates.onboardingSubmitted(name)),
  sendAdminOnboardingAlert: (email, providerName) => sendEmail(email, `New Provider Pending Verification: ${providerName}`, templates.adminOnboardingAlert(providerName)),
  sendVerificationApproved: (email, name) => sendEmail(email, "You're Verified on Carely!", templates.verificationApproved(name)),
  sendVerificationRejected: (email, name, reason) => sendEmail(email, 'Carely Verification Update', templates.verificationRejected(name, reason)),
};
