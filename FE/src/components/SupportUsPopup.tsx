// src/components/SupportUsPopup.tsx
import React from 'react';

interface SupportUsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSignUp: () => void;
}

const SupportUsPopup: React.FC<SupportUsPopupProps> = ({ isOpen, onClose, onSignUp }) => {
  
  const handleSignUpClick = () => {
    onSignUp(); // Navigate to signup
    onClose();  // Close popup
  };

  const handleMaybeLater = () => {
    onClose(); // Just close popup
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
        onClick={onClose} // Close when clicking overlay
      >
        {/* Popup Container */}
        <div 
          style={{
            backgroundColor: 'rgb(240,240,240)',
            color: 'black',
            padding: '2rem',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside popup
        >
          {/* Header */}
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            Support Us
          </h2>

          {/* Main Message */}
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            marginBottom: '1rem',
            color: '#1f2937'
          }}>
            We Value Your Presence!
          </h3>

          {/* Description */}
          <p style={{ 
            fontSize: '1rem', 
            lineHeight: '1.6',
            color: '#6b7280',
            marginBottom: '2rem'
          }}>
            Support us by creating an account and using Moodly to track your mood. 
            Your participation helps us build a better mood tracking community for everyone.
          </p>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={handleMaybeLater}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              Maybe Later
            </button>
            <button
              onClick={handleSignUpClick}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              Sign Up Now
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SupportUsPopup;