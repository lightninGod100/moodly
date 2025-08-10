// routes/contact.js
const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { sendContactEmail } = require('../services/emailService');
const { validateEmail } = require('../middleware/emailValidation');
const { contactProgressiveLimiter } = require('../middleware/progressivePenalty');
const { ERROR_CATALOG, getError } = require('../config/errorCodes');
const ErrorLogger = require('../services/errorLogger');
const router = express.Router();


// Create conditional middleware for contact (since email is optional for authenticated users)
const validateContactEmail = (req, res, next) => {
  // Skip validation if no email provided and user is authenticated
  if (!req.body.email && req.headers['authorization']) {
    return next();
  }
  
  // If email is provided, validate it
  if (req.body.email) {
    return validateEmail(req, res, next);
  }
  
  next();
};
// Helper function to get user data from JWT token (optional)
const getUserFromToken = async (authHeader) => {
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userResult = await pool.query(
      'SELECT id, username, email FROM users WHERE id = $1',
      [decoded.userId]
    );

    return userResult.rows.length > 0 ? userResult.rows[0] : null;
  } catch (error) {
    console.log('Token verification failed (non-authenticated user):', error.message);
    return null;
  }
};

// POST /api/contact - Handle contact form submissions
router.post('/', contactProgressiveLimiter, validateContactEmail, async (req, res) => {
  try {
    const { reason, message, email: formEmail } = req.body;
    const authHeader = req.headers['authorization'];

    // Subject validation
    if (!reason || !reason.trim()) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.CONTACT_SUBJECT_REQUIRED.code,
        ERROR_CATALOG.CONTACT_SUBJECT_REQUIRED.message
      );
      return res.status(400).json(errorResponse);
    }

    // Message validation
    if (!message || !message.trim()) {
      const errorResponse = ErrorLogger.createErrorResponse(
        ERROR_CATALOG.CONTACT_MESSAGE_REQUIRED.code,
        ERROR_CATALOG.CONTACT_MESSAGE_REQUIRED.message
      );
      return res.status(400).json(errorResponse);
    }

    // Try to get user data from JWT token
    const user = await getUserFromToken(authHeader);
    
    let userEmail, userId;

    if (user) {
      // Authenticated user - use data from database
      userEmail = user.email;
      userId = user.id;
    } else {
      // Non-authenticated user - email is required and already validated by middleware
      if (!formEmail || !formEmail.trim()) {
        const errorResponse = ErrorLogger.createErrorResponse(
          ERROR_CATALOG.CONTACT_EMAIL_REQUIRED.code,
          ERROR_CATALOG.CONTACT_EMAIL_REQUIRED.message
        );
        return res.status(400).json(errorResponse);
      }

      // Email validation is handled by validateContactEmail middleware
      // No need for redundant validation here
      userEmail = formEmail.trim();
      userId = null;
    }

    const now = Date.now();
    const subject = `[Moodly Contact] - ${reason.trim()}`;

    // Save to database first
    let submissionResult;
    try {
      submissionResult = await pool.query(
        'INSERT INTO email_logs (user_id, email_type, subject, body, recipient_email, created_at_utc, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [userId, 'contact_form', subject, message.trim(), userEmail, now, 'pending']
      );
    } catch (dbError) {
      const errorResponse = ErrorLogger.logAndCreateResponse(
        ERROR_CATALOG.DB_INSERT_FAILED.code,
        'Contact form database insertion',
        dbError,
        'Failed to save your message. Please try again.',
        userId
      );
      return res.status(500).json(errorResponse);
    }

    const submissionId = submissionResult.rows[0].id;

    // Prepare email content for service
    const emailContent = `
New Contact Form Submission

Submission ID: ${submissionId}
Email: ${userEmail}
User ID: ${userId || 'Guest User'}
Reason: ${reason.trim()}
Submitted: ${new Date(now).toISOString()}

Message:
${message.trim()}

---
This message was sent via Moodly Contact Form
    `.trim();

    // Prepare email data for service
    const emailData = {
      to: process.env.EMAIL_USER, // Send to Moodly email
      subject: subject,
      content: emailContent
    };

    // Send email using service
    try {
      await sendContactEmail(emailData);
      
      // Update status to 'sent'
      try {
        await pool.query(
          'UPDATE email_logs SET status = $1 WHERE id = $2',
          ['sent', submissionId]
        );
      } catch (updateError) {
        ErrorLogger.logError(
          ERROR_CATALOG.DB_UPDATE_FAILED.code,
          'Contact email status update to sent',
          updateError,
          userId
        );
        // Continue - status update failure shouldn't affect user experience
      }

      console.log(`Contact email sent successfully for submission ${submissionId}`);

      res.status(200).json({
        message: 'Your message has been sent successfully',
        submissionId: submissionId
      });

    } catch (emailError) {
      ErrorLogger.logError(
        ERROR_CATALOG.EMAIL_SENDING_FAILED.code,
        'Contact email sending',
        emailError,
        userId
      );
      
      // Update status to 'failed'
      try {
        await pool.query(
          'UPDATE email_logs SET status = $1 WHERE id = $2',
          ['failed', submissionId]
        );
      } catch (updateError) {
        ErrorLogger.logError(
          ERROR_CATALOG.DB_UPDATE_FAILED.code,
          'Contact email status update to failed',
          updateError,
          userId
        );
      }

      // Still return success to user (we have their message saved)
      res.status(200).json({
        message: 'Your message has been received and will be processed shortly',
        submissionId: submissionId,
        note: 'Email delivery is being processed'
      });
    }

  } catch (error) {
    const errorResponse = ErrorLogger.logAndCreateResponse(
      ERROR_CATALOG.SYS_INTERNAL_ERROR.code,
      'Contact form general error handling',
      error,
      'Internal server error while processing your message',
      null
    );
    res.status(500).json(errorResponse);
  }
});

// GET /api/contact/test - Test email configuration (development only)
// GET /api/contact/test - Test email configuration (development only)
router.get('/test', async (req, res) => {
  try {
    // Environment validation
    if (process.env.NODE_ENV === 'production') {
      const errorResponse = ErrorLogger.logAndCreateResponse(
        ERROR_CATALOG.AUTH_UNAUTHORIZED.code,
        'Production environment access attempt to test endpoint',
        new Error('Test endpoint accessed in production'),
        'Not found',
        null
      );
      return res.status(404).json(errorResponse);
    }

    // Check email configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      const errorResponse = ErrorLogger.logAndCreateResponse(
        ERROR_CATALOG.EMAIL_CONFIG_ERROR.code,
        'Missing email configuration environment variables',
        new Error('EMAIL_USER or EMAIL_APP_PASSWORD not configured'),
        'Email configuration incomplete',
        null
      );
      return res.status(500).json(errorResponse);
    }

    const { testEmailConfiguration } = require('../services/emailService');
    
    let result;
    try {
      result = await testEmailConfiguration();
    } catch (configError) {
      const errorResponse = ErrorLogger.logAndCreateResponse(
        ERROR_CATALOG.EMAIL_SERVICE_UNAVAILABLE.code,
        'Email service configuration test failure',
        configError,
        'Email service configuration test failed',
        null
      );
      return res.status(500).json(errorResponse);
    }
    
    res.json({
      message: result.message,
      emailUser: process.env.EMAIL_USER ? 'Configured' : 'Missing',
      emailPassword: process.env.EMAIL_APP_PASSWORD ? 'Configured' : 'Missing',
      testResult: 'Success'
    });

  } catch (error) {
    const errorResponse = ErrorLogger.logAndCreateResponse(
      ERROR_CATALOG.SYS_INTERNAL_ERROR.code,
      'Email configuration test general error',
      error,
      'Internal server error during email configuration test',
      null
    );
    res.status(500).json(errorResponse);
  }
});

module.exports = router;