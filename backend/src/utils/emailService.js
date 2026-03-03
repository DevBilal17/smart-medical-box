const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async ({ email, subject, template, data }) => {
  try {
    let html = '';

    // Simple templates (in production, use a template engine like handlebars)
    if (template === 'emailVerification') {
      html = `
        <h1>Welcome to Smart Medical Box!</h1>
        <p>Hello ${data.name},</p>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${data.verificationUrl}">Verify Email</a>
        <p>This link expires in 24 hours.</p>
      `;
    } else if (template === 'passwordReset') {
      html = `
        <h1>Password Reset Request</h1>
        <p>Hello ${data.name},</p>
        <p>You requested to reset your password. Click the link below:</p>
        <a href="${data.resetUrl}">Reset Password</a>
        <p>This link expires in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `;
    } else if (template === 'passwordResetSuccess') {
      html = `
        <h1>Password Reset Successful</h1>
        <p>Hello ${data.name},</p>
        <p>Your password has been successfully reset.</p>
        <p>If you didn't perform this action, please contact support immediately.</p>
      `;
    } else if (template === 'healthAlert') {
      html = `
        <h1>Health Alert</h1>
        <p>Hello ${data.name},</p>
        <p>${data.message}</p>
        <p>Time: ${data.time}</p>
        <p>Please check your health dashboard for more details.</p>
      `;
    } else if (template === 'medicineReminder') {
      html = `
        <h1>Medicine Reminder</h1>
        <p>Hello ${data.name},</p>
        <p>It's time to take your medicine:</p>
        <p><strong>${data.medicine}</strong> - ${data.dosage}</p>
        <p>Time: ${data.time}</p>
      `;
    }

    const mailOptions = {
      from: '"Smart Medical Box" <noreply@smartmedicalbox.com>',
      to: email,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error };
  }
};

module.exports = { sendEmail };