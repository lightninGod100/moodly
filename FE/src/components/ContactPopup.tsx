// src/components/ContactPopup.tsx
import React, { useState, useEffect } from 'react';

interface ContactPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, message: string, email?: string) => Promise<void>;
}

const ContactPopup: React.FC<ContactPopupProps> = ({ isOpen, onClose, onSubmit }) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Check authentication status when component mounts or isOpen changes
  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('authToken');
      setIsAuthenticated(!!token);
    }
  }, [isOpen]);

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!selectedReason || !message.trim()) {
      alert('Please select a reason and enter a message');
      return;
    }

    // Email validation for non-authenticated users
    if (!isAuthenticated) {
      if (!email.trim()) {
        alert('Please enter your email address');
        return;
      }
      if (!validateEmail(email.trim())) {
        alert('Please enter a valid email address');
        return;
      }
    }

    try {
      setIsLoading(true); // Start loading
      
      // Call the onSubmit function with the form data
      // For authenticated users, email will be undefined (pulled from backend)
      // For non-authenticated users, pass the email from form
      await onSubmit(selectedReason, message, isAuthenticated ? undefined : email.trim());
      
      // Show success screen only if API call succeeds
      setIsSubmitted(true);
      // Clear form data after successful submission
      setSelectedReason('');
      setMessage('');
      setEmail('');
    } catch (error) {
      // Error is already handled in LandingPage (alert shown)
      // Don't show success screen, keep form open for retry
      console.log('Contact form submission failed, keeping form open for retry');
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  const handleCancel = () => {
    // Reset all states
    setSelectedReason('');
    setMessage('');
    setEmail('');
    setIsSubmitted(false);
    setIsLoading(false);
    onClose();
  };

  const handleClose = () => {
    // Only reset loading and submission states, keep form data
    setIsSubmitted(false);
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={handleClose} // Close when clicking overlay
      >
        {/* Popup Container */}
        <div 
          style={{
            backgroundColor: 'rgb(245, 245, 245)',
            color: 'black',
            padding: isSubmitted ? '1.5rem' : '2rem',
            borderRadius: '15px',
            width: isSubmitted ? '90%' : '90%',
            maxWidth: isSubmitted ? '550px' : '600px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside popup
        >
          {/* Header - Only show for form, not success */}
          {!isSubmitted && (
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>
              Contact Us
            </h2>
          )}

          {/* Conditional Content: Success Screen OR Form */}
          {isSubmitted ? (
            /* Success Screen */
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              {/* Green Circle with Mail Icon */}
              <div style={{
                width: '100px',
                height: '100px',
                backgroundColor: 'transparent',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}>
                <img 
                  src="/public/images/mail.png" 
                  alt="message" 
                  style={{
                    height: '100%',
                    width: '100%',
                    
                    
                  }} 
                />
              </div>
              
              {/* Thank You Title */}
              <h3 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                marginBottom: '1rem',
                color: '#1f2937'
              }}>
                Delivered!
              </h3>
              
              {/* Success Message */}
              <p style={{ 
                fontSize: '1rem', 
                marginBottom: '2rem', 
                lineHeight: '1.6',
                color: 'rgb(20, 20, 20)'
              }}>
                Thanks for the message. <br />
                We will get back in touch with you as soon as possible.
              </p>
              
              {/* Green OK Button */}
              <button
                onClick={handleClose}
                style={{
                  width: '30%',
                  padding: '0.75rem',
                  backgroundColor: 'rgb(30, 130, 240)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                OK
              </button>
            </div>
          ) : (
            /* Original Form */
            <form onSubmit={handleSubmit}>
              {/* Authentication Status Info (Optional Display) */}
              {isAuthenticated && (
                <div style={{ 
                  marginBottom: '1rem', 
                  padding: '0.5rem', 
                  backgroundColor: '#e1f5fe', 
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  color: '#0277bd',
                  textAlign: 'center'
                }}>
                  📧 We'll use your account email for correspondence
                </div>
              )}

              {/* Email Field - Only for Non-Authenticated Users */}
              {!isAuthenticated && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Email Address: <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '1rem'
                    }}
                    required
                  />
                </div>
              )}

              {/* Reason Dropdown */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Reason for Contact: <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="Signup-login Issues">SignUp/Login Issues</option>
                  <option value="Suggestions">Suggestions</option>
                  <option value="Bug Report">Report a Bug</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              {/* Message Textarea */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Message: <span style={{ color: 'red' }}>*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please describe your issue, suggestion, or request in detail..."
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '0.5rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                  required
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isLoading}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: isLoading ? '#e5e7eb' : '#f3f4f6',
                    color: isLoading ? '#9ca3af' : 'black',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    opacity: isLoading ? 0.6 : 1
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: isLoading ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    minWidth: '100px'
                  }}
                >
                  {isLoading ? (
                    <>
                      {/* Spinner */}
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid transparent',
                          borderTop: '2px solid white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}
                      />
                      Sending...
                    </>
                  ) : (
                    'Submit'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      
      {/* CSS Animation for Spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default ContactPopup;