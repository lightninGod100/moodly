// BE/middleware/emailValidation.js

/**
 * Email Domain Validation Middleware
 * Validates email domains against whitelist of secure, OTP/phone-verified providers
 * Blocks + signs and provides specific error messages
 */

// Secure email domains that require phone/OTP verification
const SECURE_EMAIL_DOMAINS = [
    // Major Global Providers (OTP/Phone verified)
    'gmail.com',
    'googlemail.com',
    'outlook.com',
    'hotmail.com',
    'live.com',
    'msn.com',
    'yahoo.com',
    'yahoo.co.uk',
    'yahoo.ca',
    'yahoo.com.au',
    'ymail.com',
    'icloud.com',
    'me.com',
    'mac.com',
    'protonmail.com',
    'proton.me',
    
    // US Regional Providers (Phone/SMS verified)
    'verizon.net',
    'att.net',
    'comcast.net',
    'xfinity.com',
    'charter.net',
    'cox.net',
    'earthlink.net',
    'aol.com',
    
    // European Regional Providers (Phone/SMS verified)
    // Germany
    't-online.de',
    'gmx.de',
    'web.de',
    // UK
    'bt.com',
    'btinternet.com',
    'sky.com',
    // France
    'orange.fr',
    'wanadoo.fr',
    'free.fr',
    // Netherlands
    'ziggo.nl',
    'xs4all.nl',
    // Spain
    'telefonica.net',
    // Italy
    'libero.it',
    'virgilio.it',
    // Switzerland
    'bluewin.ch',
    
    // Other Secure Providers
    'fastmail.com',
    'tutanota.com',
    'zoho.com'
  ];
  
  /**
   * Normalize email address
   * @param {string} email - Raw email input
   * @returns {string} - Normalized email (lowercase, trimmed)
   */
  const normalizeEmail = (email) => {
    if (!email || typeof email !== 'string') {
      return '';
    }
    return email.toLowerCase().trim();
  };
  
  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} - True if valid format
   */
  const isValidEmailFormat = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  /**
   * Check if email contains plus sign
   * @param {string} email - Email to check
   * @returns {boolean} - True if contains +
   */
  const containsPlusSign = (email) => {
    return email.includes('+');
  };
  
  /**
   * Extract domain from email
   * @param {string} email - Email address
   * @returns {string} - Domain part
   */
  const extractDomain = (email) => {
    const parts = email.split('@');
    return parts.length === 2 ? parts[1] : '';
  };
  
  /**
   * Check if domain is in secure whitelist
   * @param {string} domain - Email domain
   * @returns {boolean} - True if domain is allowed
   */
  const isSecureDomain = (domain) => {
    return SECURE_EMAIL_DOMAINS.includes(domain);
  };
  
  /**
   * Email validation middleware
   * Validates email against secure domain whitelist and business rules
   */
  const validateEmail = (req, res, next) => {
    try {
      // Extract email from request body
      const rawEmail = req.body.email;
      
      // Check if email is provided
      if (!rawEmail) {
        return res.status(400).json({
          error: 'Email is required'
        });
      }
      
      // Normalize email
      const email = normalizeEmail(rawEmail);
      
      // Validate email format
      if (!isValidEmailFormat(email)) {
        return res.status(400).json({
          error: 'Invalid email format'
        });
      }
      
      // Check for plus sign (aliasing)
      if (containsPlusSign(email)) {
        return res.status(400).json({
          error: 'Email with \'+\' character not supported'
        });
      }
      
      // Extract and validate domain
      const domain = extractDomain(email);
      if (!domain) {
        return res.status(400).json({
          error: 'Invalid email format'
        });
      }
      
      // Check against secure domain whitelist
      if (!isSecureDomain(domain)) {
        return res.status(400).json({
          error: 'The email domain is not allowed due to security reasons, please use email with common domains like gmail, yahoo etc'
        });
      }
      
      // Replace original email with normalized version
      req.body.email = email;
      
      // Continue to next middleware
      next();
      
    } catch (error) {
      console.error('Email validation error:', error);
      return res.status(500).json({
        error: 'Internal server error during email validation'
      });
    }
  };
  
  /**
   * Get list of allowed domains (for documentation/debugging)
   * @returns {Array} - Array of allowed domains
   */
  const getAllowedDomains = () => {
    return [...SECURE_EMAIL_DOMAINS];
  };
  
  /**
   * Add new domain to whitelist (for future expansion)
   * @param {string} domain - Domain to add
   * @returns {boolean} - True if added successfully
   */
  const addSecureDomain = (domain) => {
    const normalizedDomain = domain.toLowerCase().trim();
    if (!SECURE_EMAIL_DOMAINS.includes(normalizedDomain)) {
      SECURE_EMAIL_DOMAINS.push(normalizedDomain);
      return true;
    }
    return false;
  };
  
  module.exports = {
    validateEmail,
    getAllowedDomains,
    addSecureDomain,
    // Export individual functions for testing
    normalizeEmail,
    isValidEmailFormat,
    containsPlusSign,
    extractDomain,
    isSecureDomain
  };