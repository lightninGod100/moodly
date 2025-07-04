// src/components/ContactPopup.tsx
import React, { useState } from 'react';

interface ContactPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, message: string) => void;
}

const ContactPopup: React.FC<ContactPopupProps> = ({ isOpen, onClose, onSubmit }) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!selectedReason || !message.trim()) {
      alert('Please select a reason and enter a message');
      return;
    }

    // Call the onSubmit function with the form data
    onSubmit(selectedReason, message);
    
    // Show success screen instead of closing
    setIsSubmitted(true);
  };

  const handleCancel = () => {
    // Reset all states
    setSelectedReason('');
    setMessage('');
    setIsSubmitted(false);
    onClose();
  };

  const handleClose = () => {
    // Reset all states
    setSelectedReason('');
    setMessage('');
    setIsSubmitted(false);
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
            backgroundColor: 'white',
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
                Delievered!
              </h3>
              
              {/* Success Message */}
              <p style={{ 
                fontSize: '1rem', 
                marginBottom: '2rem', 
                lineHeight: '1.6',
                color: '#6b7280'
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
              {/* Reason Dropdown */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Reason for Contact:
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
                  <option value="Issues">App Related Issues</option>
                  <option value="Suggestion">Suggestion</option>
                  <option value="Account Deletion">Account Deletion</option>
                </select>
              </div>

              {/* Message Textarea */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Message:
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
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#f3f4f6',
                    color: 'black',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Submit
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default ContactPopup;