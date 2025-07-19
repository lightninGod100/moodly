// src/components/AuthenticatedNavbar.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

interface AuthNavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}
// Profile Photo Component
const ProfilePhoto: React.FC = () => {
  const { user } = useUser();

  const profileStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    border: '2px solid #e5e7eb'
  };

  if (user?.profilePhoto) {
    // User has profile photo
    return (
      <div 
        style={{
          ...profileStyle,
          backgroundImage: `url(${user.profilePhoto})`
        }}
      />
    );
  } else {
    // Use default profile photo from CSS variable
    return (
      <div 
        style={{
          ...profileStyle,
          backgroundImage: 'var(--default-pp)'
        }}
      />
    );
  }
};

const AuthenticatedNavbar: React.FC<AuthNavbarProps> = ({ onNavigate, currentPage }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDropdownToggle = () => {
    setShowDropdown(!showDropdown);
  };

  const handleDropdownItemClick = (action: string) => {
    setShowDropdown(false); // Close dropdown first
    
    switch (action) {
      case 'settings':
        onNavigate('settings');
        break;
      case 'support':
        console.log('Support clicked - placeholder (no action)');
        // Complete placeholder - nothing happens
        break;
      case 'privacy':
        onNavigate('privacy-and-terms');
        break;
      case 'logout':
        onNavigate('logout');
        break;
    }
  };

  // Remove this function - not needed anymore
  // const handleContactSubmit = async (reason: string, message: string, email?: string) => {
  //   console.log('Contact form submitted (placeholder):', { reason, message, email });
  // };

  // Remove this function - not needed anymore  
  // const handleContactClose = () => {
  //   setShowContactPopup(false);
  // };

  return (
    <>
      <nav className="w-full py-3 px-6 flex justify-between items-center">
        <div className="text-2xl font-bold">Moodly</div>
        <div className="flex gap-6 items-center">
          <button 
            className={`px-2 ${currentPage === 'home' ? 'font-semibold' : ''}`}
            onClick={() => onNavigate('home')}
          >
            Home
          </button>
          <button 
            className={`px-2 ${currentPage === 'globe' ? 'font-semibold' : ''}`}
            onClick={() => onNavigate('globe')}
          >
            Globe
          </button>
          <button 
            className={`px-2 ${currentPage === 'dashboard' ? 'font-semibold' : ''}`}
            onClick={() => onNavigate('dashboard')}
          >
            Dashboard
          </button>
          
          {/* Account Dropdown */}
          <div className="relative" ref={dropdownRef}>
          <button
              className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 rounded transition-colors"
              onClick={handleDropdownToggle}
              onMouseEnter={() => setShowDropdown(true)}
            >
              {/* Profile Circle */}
              <ProfilePhoto />
              
              {/* Account Text */}
              <span>Account</span>
              
              {/* Dropdown Arrow */}
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                style={{
                  transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}
              >
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div 
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  minWidth: '160px',
                  zIndex: 50,
                  marginTop: '4px'
                }}
                onMouseLeave={() => setShowDropdown(false)}
              >
                <div style={{ padding: '8px 0' }}>
                  <button
                    onClick={() => handleDropdownItemClick('settings')}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 16px',
                      fontSize: '14px',
                      color: '#374151',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    Settings
                  </button>
                  
                  <button
                    onClick={() => handleDropdownItemClick('support')}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 16px',
                      fontSize: '14px',
                      color: '#374151',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    Support
                  </button>
                  
                  <button
                    onClick={() => handleDropdownItemClick('privacy')}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 16px',
                      fontSize: '14px',
                      color: '#374151',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    Privacy & Terms
                  </button>
                  
                  {/* Separator */}
                  <div style={{
                    height: '1px',
                    backgroundColor: '#e5e7eb',
                    margin: '4px 0'
                  }} />
                  
                  <button
                    onClick={() => handleDropdownItemClick('logout')}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 16px',
                      fontSize: '14px',
                      color: '#dc2626',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default AuthenticatedNavbar;