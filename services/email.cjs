const nodemailer = require('nodemailer');

// Create reusable transporter object using Gmail SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.SMTP_USER || 'noreply@neuraplay.biz',
    pass: process.env.SMTP_APP_PASSWORD // Use Google App Password
  }
});

// Verify SMTP connection configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to send emails');
  }
});

// Email templates
const templates = {
  verification: (code) => ({
    subject: 'Verify Your NeuraPlay Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <img src="https://neuraplay.biz/assets/images/Mascot.png" alt="NeuraPlay Logo" style="width: 100px; margin: 20px 0;">
        <h1 style="color: #6366f1;">Welcome to NeuraPlay!</h1>
        <p>Thank you for joining our learning platform. To get started, please verify your email address by entering this code:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
          <h2 style="color: #4f46e5; letter-spacing: 5px; font-size: 24px;">${code}</h2>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't create a NeuraPlay account, please ignore this email.</p>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            NeuraPlay - Transforming Education Through AI<br>
            © ${new Date().getFullYear()} NeuraPlay. All rights reserved.
          </p>
        </div>
      </div>
    `
  }),
  
  welcome: (username) => ({
    subject: 'Welcome to NeuraPlay!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <img src="https://neuraplay.biz/assets/images/Mascot.png" alt="NeuraPlay Logo" style="width: 100px; margin: 20px 0;">
        <h1 style="color: #6366f1;">Welcome ${username}!</h1>
        <p>Your NeuraPlay account has been successfully verified. You're now ready to start your learning journey!</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #4f46e5;">Getting Started:</h3>
          <ul style="color: #374151;">
            <li>Complete your profile</li>
            <li>Explore our learning games</li>
            <li>Join the community forum</li>
            <li>Track your progress</li>
          </ul>
        </div>
        <a href="https://neuraplay.biz/dashboard" 
           style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Go to Dashboard
        </a>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            NeuraPlay - Transforming Education Through AI<br>
            © ${new Date().getFullYear()} NeuraPlay. All rights reserved.
          </p>
        </div>
      </div>
    `
  }),

  passwordReset: (token) => ({
    subject: 'Reset Your NeuraPlay Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <img src="https://neuraplay.biz/assets/images/Mascot.png" alt="NeuraPlay Logo" style="width: 100px; margin: 20px 0;">
        <h1 style="color: #6366f1;">Password Reset Request</h1>
        <p>We received a request to reset your NeuraPlay account password. Click the button below to reset your password:</p>
        <a href="https://neuraplay.biz/reset-password?token=${token}" 
           style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Reset Password
        </a>
        <p>This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.</p>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            NeuraPlay - Transforming Education Through AI<br>
            © ${new Date().getFullYear()} NeuraPlay. All rights reserved.
          </p>
        </div>
      </div>
    `
  })
};

// Send email function
async function sendEmail(to, template, data) {
  try {
    const { subject, html } = templates[template](data);
    
    const mailOptions = {
      from: '"NeuraPlay" <noreply@neuraplay.biz>',
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendEmail,
  templates
};
