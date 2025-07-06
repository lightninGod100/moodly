// src/components/FAQPopup.tsx
import React from 'react';

interface FAQPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const FAQPopup: React.FC<FAQPopupProps> = ({ isOpen, onClose }) => {
  
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
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            FAQs
          </h2>

          {/* Coming Soon Message */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
              🚧
            </div>
            <p style={{ 
              fontSize: '1.25rem', 
              color: 'rgb(10, 10, 10)',
              lineHeight: '1.6',
              fontWeight: 'bold'
            }}>
              Coming Soon!
            </p>
            <p style={{ 
              fontSize: '1rem', 
              color: 'rgb(20, 20, 20)',
              marginTop: '0.5rem'
            }}>
              We're working on comprehensive FAQs for you!
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 3rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            OK
          </button>
        </div>
      </div>
    </>
  );
};

export default FAQPopup;