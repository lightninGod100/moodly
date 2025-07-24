// services/emailService.js
const nodemailer = require('nodemailer');

// Email transporter configuration
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    }
  });
};

/**
 * Send contact form email - Pure email sending only
 * @param {Object} emailData - Email data prepared by route
 */
const sendContactEmail = async (emailData) => {
  try {
    const { to, subject, content } = emailData;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      text: content
    };

    const transporter = createEmailTransporter();
    await transporter.sendMail(mailOptions);
    
    console.log(`✅ Contact email sent successfully to: ${to}`);

  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
};

/**
 * Send account deletion emails - Pure email sending only
 * @param {Object} userEmailData - User email data
 * @param {Object} adminEmailData - Admin email data  
 */
const sendAccountDeletionEmails = async (userEmailData, adminEmailData) => {
  try {
    const transporter = createEmailTransporter();
    
    await Promise.all([
      transporter.sendMail(userEmailData),
      transporter.sendMail(adminEmailData)
    ]);

    console.log(`✅ Account deletion emails sent successfully`);

  } catch (error) {
    console.error('❌ Account deletion emails failed:', error);
    throw error;
  }
};

/**
 * Test email configuration
 */
const testEmailConfiguration = async () => {
  try {
    const transporter = createEmailTransporter();
    await transporter.verify();
    
    return {
      success: true,
      message: 'Email configuration is working correctly'
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  sendContactEmail,
  sendAccountDeletionEmails,
  testEmailConfiguration
};