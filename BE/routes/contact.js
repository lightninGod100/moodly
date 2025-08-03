// routes/contact.js
const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { sendContactEmail } = require('../services/emailService');
const { validateEmail } = require('../middleware/emailValidation');

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
router.post('/', validateContactEmail, async (req, res) => {
  try {
    const { reason, message, email: formEmail } = req.body;
    const authHeader = req.headers['authorization'];

    // Validation
    if (!reason || !message) {
      return res.status(400).json({
        error: 'Reason and message are required'
      });
    }

    if (!reason.trim() || !message.trim()) {
      return res.status(400).json({
        error: 'Reason and message cannot be empty'
      });
    }

    // Try to get user data from JWT token
    const user = await getUserFromToken(authHeader);
    
    let userEmail, userId;

    if (user) {
      // Authenticated user - use data from database
      userEmail = user.email;
      userId = user.id;
    } else {
      // Non-authenticated user - use email from form
      if (!formEmail || !formEmail.trim()) {
        return res.status(400).json({
          error: 'Email is required for non-authenticated users'
        });
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formEmail.trim())) {
        return res.status(400).json({
          error: 'Invalid email format'
        });
      }

      userEmail = formEmail.trim();
      userId = null;
    }

    const now = Date.now();
    const subject = `[Moodly Contact] - ${reason}`;

    // Save to database first
    const submissionResult = await pool.query(
      'INSERT INTO email_logs (user_id, email_type, subject, body, recipient_email, created_at_utc, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [userId, 'contact_form', subject, message.trim(), userEmail, now, 'pending']
    );

    const submissionId = submissionResult.rows[0].id;

    // Prepare email content for service
    const emailContent = `
New Contact Form Submission

Submission ID: ${submissionId}
Email: ${userEmail}
User ID: ${userId || 'Guest User'}
Reason: ${reason}
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
      await pool.query(
        'UPDATE email_logs SET status = $1 WHERE id = $2',
        ['sent', submissionId]
      );

      console.log(`Contact email sent successfully for submission ${submissionId}`);

      res.status(200).json({
        message: 'Your message has been sent successfully',
        submissionId: submissionId
      });

    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      // Update status to 'failed'
      await pool.query(
        'UPDATE email_logs SET status = $1 WHERE id = $2',
        ['failed', submissionId]
      );

      // Still return success to user (we have their message saved)
      res.status(200).json({
        message: 'Your message has been received and will be processed shortly',
        submissionId: submissionId,
        note: 'Email delivery is being processed'
      });
    }

  } catch (error) {
    console.error('Contact form error:', error);
    
    res.status(500).json({
      error: 'Internal server error while processing your message',
      message: 'Please try again later or contact support directly'
    });
  }
});

// GET /api/contact/test - Test email configuration (development only)
router.get('/test', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ error: 'Not found' });
    }

    const { testEmailConfiguration } = require('../services/emailService');
    
    const result = await testEmailConfiguration();
    
    res.json({
      message: result.message,
      emailUser: process.env.EMAIL_USER ? 'Configured' : 'Missing',
      emailPassword: process.env.EMAIL_APP_PASSWORD ? 'Configured' : 'Missing'
    });

  } catch (error) {
    console.error('Email test failed:', error);
    res.status(500).json({
      error: 'Email configuration test failed',
      details: error.message
    });
  }
});

module.exports = router;