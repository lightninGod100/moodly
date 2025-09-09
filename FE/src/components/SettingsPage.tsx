// src/components/SettingsPage.tsx
import { settingsApiService } from '../services/SettingsService';
import React, { useState, useEffect, useRef } from 'react';
import type { UserSettings, PasswordChangeRequest, CountryUpdateRequest, PhotoUploadRequest, AccountDeletionRequest, PasswordValidationRequest } from '../services/SettingsService';
import { useUser } from '../contexts/UserContext';
import * as THREE from 'three';
import WAVES from 'vanta/dist/vanta.waves.min';
import '../styles/design-system.css';

const SettingsPage: React.FC = () => {
  // Vanta refs
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);

  // User data state - now using API data
  const { user, dispatch } = useUser();

  // Form states
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [selectedCountry, setSelectedCountry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMessages, setSuccessMessages] = useState<{ [key: string]: string }>({});
  const [showDeletionConfirm, setShowDeletionConfirm] = useState(false);
  const [deletionPassword, setDeletionPassword] = useState('');
  const [isPhotoHovered, setIsPhotoHovered] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false);
  const [showSettingsToast, setShowSettingsToast] = useState(false);
  // Load user settings from API
  // Initialize form with context data
  const initializeForm = () => {
    if (user) {
      setSelectedCountry(userData.country);
    }
  };

  // Initialize form when user data loads
  useEffect(() => {
    initializeForm();
  }, [user]);

  // Initialize Vanta effect
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (!vantaEffect.current && vantaRef.current) {
          console.log('Initializing Vanta Waves for Settings...');

          vantaEffect.current = WAVES({
            el: vantaRef.current,
            THREE: THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: 0xb0b10,
            shininess: 50,
            waveHeight: 20,
            waveSpeed: 1.2,
            zoom: 0.75
          });

          console.log('Vanta effect created for Settings');

          // Force a resize after creation
          setTimeout(() => {
            if (vantaEffect.current && vantaEffect.current.resize) {
              vantaEffect.current.resize();
            }
          }, 500);
        }
      } catch (error) {
        console.error('Error initializing Vanta Waves:', error);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      try {
        if (vantaEffect.current) {
          console.log('Destroying Vanta effect...');
          vantaEffect.current.destroy();
          vantaEffect.current = null;
        }
      } catch (error) {
        console.error('Error destroying Vanta effect:', error);
      }
    };
  }, []);

// Show toast when user data is not available
useEffect(() => {
  if (!user) {
    setShowSettingsToast(true);
    const timer = setTimeout(() => {
      setShowSettingsToast(false);
    }, 3000);
    return () => clearTimeout(timer);
  }
}, [user]);

  // Countries list
  const countries = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina',
    'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados',
    'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana',
    'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada',
    'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo',
    'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Democratic Republic of the Congo',
    'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador',
    'Equatorial Guinea', 'Eritrea', 'Estonia', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon',
    'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
    'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
    'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait',
    'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein',
    'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta',
    'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco',
    'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal',
    'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia',
    'Norway', 'Oman', 'Pakistan', 'Palau', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru',
    'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis',
    'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe',
    'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia',
    'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain',
    'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan',
    'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey',
    'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom',
    'United States of America', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela',
    'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
  ];

 
// Create default userData when user is null
const userData = user || {
  username: 'user_1',
  email: '',
  country: '',
  gender: '',
  profilePhoto: '/images/pp.jpg',
  lastCountryChangeAt: 0,
  canChangeCountry: false,
  nextCountryChangeDate: null,
  markForDeletion: false,
  deletionTimestamp: null
};

// Helper functions
  // Helper functions
  const clearMessages = () => {
    setErrors({});
    setSuccessMessages({});
  };
// Handle toast close
const handleCloseToast = () => {
  setShowSettingsToast(false);
};
  // Handle password change with real API
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setErrors({ password: 'All password fields are required' });
      return;
    }

    if (passwords.new !== passwords.confirm) {
      setErrors({ password: 'New passwords do not match' });
      return;
    }

    try {
      setIsLoading(true);

      const passwordData: PasswordChangeRequest = {
        currentPassword: passwords.current,
        newPassword: passwords.new
      };

      const message = await settingsApiService.updatePassword(passwordData);
      setSuccessMessages({ password: message });
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error) {
      setErrors({ password: error instanceof Error ? error.message : 'Failed to change password' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle country change with real API
  const handleCountryChange = async () => {
    if (!userData.canChangeCountry) {
      const nextDate = userData.nextCountryChangeDate
        ? new Date(userData.nextCountryChangeDate).toLocaleDateString()
        : 'Unknown';
      setErrors({ country: `Country can only be changed once per month. Next change: ${nextDate}` });
      return;
    }

    if (selectedCountry === userData.country) {
      setErrors({ country: 'Please select a different country' });
      return;
    }

    clearMessages();

    try {
      setIsLoading(true);

      const countryData: CountryUpdateRequest = {
        country: selectedCountry
      };

      const response = await settingsApiService.updateCountry(countryData);

      // Update local state with new data
      // Update context state
      dispatch({
        type: 'UPDATE_COUNTRY',
        payload: {
          country: response.country,
          lastCountryChangeAt: response.lastCountryChangeAt
        }
      });

      setSuccessMessages({ country: response.message });
    } catch (error) {
      setErrors({ country: error instanceof Error ? error.message : 'Failed to update country' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle photo upload with real API
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    clearMessages();

    try {
      setIsLoading(true);

      // Use service validation
      const base64Data = await settingsApiService.validateImageFile(file);

      const photoData: PhotoUploadRequest = {
        photoData: base64Data
      };

      const message = await settingsApiService.uploadProfilePhoto(photoData);

      // Update local state
      // Update context state
      dispatch({
        type: 'UPDATE_PROFILE_PHOTO',
        payload: { profilePhoto: base64Data }
      });
      setSuccessMessages({ photo: message });

    } catch (error) {
      setErrors({ photo: error instanceof Error ? error.message : 'Failed to upload photo' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle photo removal with real API
  const handlePhotoRemoval = async () => {
    clearMessages();

    try {
      setIsLoading(true);

      const message = await settingsApiService.removeProfilePhoto();

      // Update local state
      // Update context state
      dispatch({
        type: 'UPDATE_PROFILE_PHOTO',
        payload: { profilePhoto: null }
      });

      setSuccessMessages({ photo: message });

    } catch (error) {
      setErrors({ photo: error instanceof Error ? error.message : 'Failed to remove photo' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle initial form submission - show final confirmation
  const handleInitialSubmission = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!deletionPassword || !deletionReason) {
      setErrors({ deletion: 'Please fill all required fields' });
      return;
    }

    // Clear any existing errors
    setErrors({});

    try {
      setIsLoading(true);

      // Step 1: Validate password first (industry standard)
      const passwordValidation: PasswordValidationRequest = {
        password: deletionPassword
      };

      await settingsApiService.validatePassword(passwordValidation);

      // Password is correct, show final confirmation
      setShowFinalConfirmation(true);

    } catch (error) {
      // Password validation failed - show error immediately
      setErrors({ deletion: error instanceof Error ? error.message : 'Password validation failed' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle account deletion with real API
  const handleAccountDeletion = async () => {
    if (!deletionPassword) {
      setErrors({ deletion: 'Password is required to delete account' });
      return;
    }

    try {
      setIsLoading(true);

      const accountData: AccountDeletionRequest = {
        password: deletionPassword,
        reason: deletionReason
      };

      const message = await settingsApiService.deleteAccount(accountData);

      const deletionTimestamp = Date.now() + (7 * 24 * 60 * 60 * 1000);

      dispatch({
        type: 'MARK_FOR_DELETION',
        payload: { markForDeletion: true, deletionTimestamp: deletionTimestamp }
      });

      alert(message);

      // Auto-logout after 2 seconds and redirect
      setTimeout(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = '/';
      }, 1000);

      // Reset all states
      setShowDeletionConfirm(false);
      setShowFinalConfirmation(false);
      setDeletionPassword('');
      setDeletionReason('');

    } catch (error) {
      setErrors({ deletion: error instanceof Error ? error.message : 'Failed to delete account' });
    } finally {
      setIsLoading(false);
    }
  };

  // Glass tile style
  const glassStyle: React.CSSProperties = {
    border: '1px solid rgba(255, 255, 255, 0.2)',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    padding: '2rem',
    borderRadius: '1rem',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    marginBottom: '2rem',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
  };

  return (
    <div ref={vantaRef} className="vanta-waves-container">
      <div style={{
        position: 'relative',
        zIndex: 1,
        color: 'white',
        padding: '2rem',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <div style={{ width: '100%', minWidth: '700px', maxWidth: '700px', paddingTop: '2rem' }}>

          {/* Header Tile */}


          {/* Basic Information & Country Tile */}
          <div style={glassStyle}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              marginBottom: '2rem',
              color: 'white',
              textAlign: 'center'
            }}>
              Basic Information
            </h3>

            {/* Profile Photo Section */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: 'rgba(255, 255, 255, 0.9)',
                textAlign: 'center'
              }}>
                Profile Photo
              </h4>

              {/* Centered Photo Display Container */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Current Photo Display */}
                <div
                  style={{ position: 'relative', marginBottom: '1rem' }}
                  onMouseEnter={() => setIsPhotoHovered(true)}
                  onMouseLeave={() => setIsPhotoHovered(false)}
                >
                  {userData.profilePhoto ? (
                    <>
                      <img
                        src={userData.profilePhoto}
                        alt="Profile"
                        style={{
                          width: '120px',
                          height: '120px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          objectPosition: 'center',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          display: 'block'
                        }}
                      />
                      {/* Delete Icon - Top Right - Only visible on hover */}
                      <button
                        onClick={handlePhotoRemoval}
                        style={{
                          position: 'absolute',
                          top: '0',
                          right: '0',
                          width: '32px',
                          height: '32px',
                          backgroundColor: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          opacity: isPhotoHovered ? 1 : 0,
                          transition: 'opacity 0.3s ease',
                          pointerEvents: isPhotoHovered ? 'auto' : 'none'
                        }}
                        title="Delete photo"
                      >
                        {/* Dustbin Icon */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3,6 5,6 21,6"></polyline>
                          <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </>
                  ) : (
                    <div style={{
                      width: '120px',
                      height: '120px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed rgba(255, 255, 255, 0.3)'
                    }}>
                      <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>No Photo</span>
                    </div>
                  )}

                  {/* Upload Icon - Bottom Right - Only visible on hover */}
                  <button
                    onClick={() => document.getElementById('photo-upload-input')?.click()}
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      width: '36px',
                      height: '36px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      opacity: isPhotoHovered ? 1 : 0,
                      transition: 'opacity 0.3s ease',
                      pointerEvents: isPhotoHovered ? 'auto' : 'none'
                    }}
                    title="Upload new photo"
                  >
                    {/* Pen Icon */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="m18.5 2.5 a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                </div>

                {/* Hidden File Input */}
                <input
                  id="photo-upload-input"
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />

                {/* Instructions */}
                <p style={{
                  fontSize: '0.875rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  textAlign: 'center',
                  marginBottom: '0.5rem'
                }}>
                  PNG or JPEG only, max 100KB, max 256×256px
                </p>

                {/* Error and Success Messages */}
                {errors.photo && (
                  <p style={{ color: '#fca5a5', fontSize: '0.875rem', textAlign: 'center' }}>
                    {errors.photo}
                  </p>
                )}
                {successMessages.photo && (
                  <p style={{ color: '#86efac', fontSize: '0.875rem', textAlign: 'center' }}>
                    {successMessages.photo}
                  </p>
                )}
              </div>
            </div>

            {/* Basic Info Fields */}
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {/* Username */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: 'rgba(255, 255, 255, 0.9)'
                }}>
                  Username
                </label>
                <input
                  type="text"
                  value={userData.username}
                  disabled
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(10px)'
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.25rem' }}>
                  Username cannot be changed
                </p>
              </div>

              {/* Email */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: 'rgba(255, 255, 255, 0.9)'
                }}>
                  Email
                </label>
                <input
                  type="email"
                  value={userData.email}
                  disabled
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(10px)'
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.25rem' }}>
                  Email cannot be changed
                </p>
              </div>

              {/* Gender */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: 'rgba(255, 255, 255, 0.9)'
                }}>
                  Gender
                </label>
                <input
                  type="text"
                  value={userData.gender}
                  disabled
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(10px)'
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.25rem' }}>
                  Gender cannot be changed
                </p>
              </div>

              {/* Country */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: 'rgba(255, 255, 255, 0.9)'
                }}>
                  Current Country
                </label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  disabled={!userData.canChangeCountry}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    backgroundColor: userData.canChangeCountry ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    color: userData.canChangeCountry ? 'white' : 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  {countries.map((country) => (
                    <option key={country} value={country} style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
                      {country}
                    </option>
                  ))}
                </select>

                {!userData.canChangeCountry && userData.nextCountryChangeDate && (
                  <p style={{ fontSize: '0.875rem', color: '#fbbf24', marginTop: '0.5rem' }}>
                    Next change available: {new Date(userData.nextCountryChangeDate).toLocaleDateString('en-GB')}
                  </p>
                )}

                {userData.canChangeCountry && selectedCountry !== userData.country && (
                  <button
                    onClick={handleCountryChange}
                    disabled={isLoading}
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      opacity: isLoading ? 0.5 : 1,
                      fontWeight: '500'
                    }}
                  >
                    {isLoading ? 'Updating...' : 'Update Country'}
                  </button>
                )}

                {errors.country && <p style={{ color: '#fca5a5', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errors.country}</p>}
                {successMessages.country && <p style={{ color: '#86efac', fontSize: '0.875rem', marginTop: '0.5rem' }}>{successMessages.country}</p>}
              </div>
            </div>
          </div>

          {/* Change Password Tile */}
          <div style={glassStyle}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              marginBottom: '2rem',
              color: 'white',
              textAlign: 'center'
            }}>
              Change Password
            </h3>

            <form onSubmit={handlePasswordChange}>
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* Current Password */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}>
                    Current Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwords.current}
                      onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        paddingRight: '3rem',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        backdropFilter: 'blur(10px)'
                      }}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255, 255, 255, 0.7)',
                        padding: '2px'
                      }}
                    >
                      {showCurrentPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
                          <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
                          <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
                          <path d="m2 2 20 20" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwords.new}
                      onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        paddingRight: '3rem',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        backdropFilter: 'blur(10px)'
                      }}
                      placeholder="Enter new password (min 6 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255, 255, 255, 0.7)',
                        padding: '2px'
                      }}
                    >
                      {showNewPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
                          <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
                          <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
                          <path d="m2 2 20 20" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      backdropFilter: 'blur(10px)'
                    }}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              {errors.password && <p style={{ color: '#fca5a5', fontSize: '0.875rem', marginTop: '1rem' }}>{errors.password}</p>}
              {successMessages.password && <p style={{ color: '#86efac', fontSize: '0.875rem', marginTop: '1rem' }}>{successMessages.password}</p>}

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  marginTop: '2rem',
                  padding: '0.75rem 2rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  opacity: isLoading ? 0.5 : 1,
                  fontWeight: '500',
                  fontSize: '1rem',
                  width: '100%'
                }}
              >
                {isLoading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>

          {/* Danger Zone Tile */}
          <div style={{
            ...glassStyle,
            border: '2px solid rgba(220, 38, 38, 0.5)',
            background: 'rgba(220, 38, 38, 0.1)',
            marginBottom: 0
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: 'red',
              textAlign: 'center'

            }}>
              Danger Zone
            </h3>

            {userData.markForDeletion ? (
              <div>
                <p style={{ fontSize: '0.875rem', color: '#fca5a5', marginBottom: '1rem', fontWeight: 'bold' }}>
                  ⚠️ Your account has been marked for deletion and will be permanently deleted in next 7 days.
                </p>
                <p style={{ fontSize: '0.875rem', color: '#86efac', marginBottom: '1rem', fontWeight: 'bold' }}>
                  ✅ You can cancel this request anytime by logging into Moodly before {userData.deletionTimestamp ? new Date(userData.deletionTimestamp).toLocaleDateString('en-GB') : 'Unknown Date'}.
                </p>
              </div>
            ) : !showDeletionConfirm ? (
              <div style={{ textAlign: 'center' }}>

                <button
                  onClick={() => setShowDeletionConfirm(true)}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Delete Account
                </button>
              </div>
            ) : showFinalConfirmation ? (
              /* FINAL CONFIRMATION SCREEN */
              <div className="glass-card" style={{
                //backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                color: 'white',
                //border: '2px solid rgba(220,38,38,0.4)', 
                borderRadius: '8px',
                padding: '0.5rem',
                textAlign: 'center',


              }}>

                <h4 style={{ fontSize: '1.35rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                  There is no going back after this.
                </h4>
                <p style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                  Please be certain.
                </p>

                {/* Error message display - matching existing style */}
                {errors.deletion && (
                  <p style={{ color: '#fca5a5', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: '500' }}>
                    ⌛ {errors.deletion}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button
                    onClick={() => setShowFinalConfirmation(false)}
                    disabled={isLoading}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '500',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? 0.5 : 1
                    }}
                  >
                    ← Go Back
                  </button>
                  <button
                    onClick={handleAccountDeletion}
                    disabled={isLoading}
                    style={{
                      padding: '0.75rem 1.25rem',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? 0.5 : 1
                    }}
                  >
                    {isLoading ? (
                      <>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid transparent',
                          borderTop: '2px solid white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                        Processing...
                      </>
                    ) : (
                      '🗑️ Delete Forever'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* ENHANCED DELETION CONFIRMATION DIALOG */
              <div>
                <div style={{
                  backgroundColor: 'rgba(250, 250, 250, 0.1)',
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  marginBottom: '1rem',
                }}>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#fca5a5', marginBottom: '1rem' }}>
                    🚨 Account Deletion Request
                  </h4>

                  <div style={{
                    backgroundColor: 'rgba(254, 242, 242, 0.1)',
                    border: '1px solid rgba(254, 202, 202, 0.3)',
                    borderRadius: '6px',
                    padding: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <p style={{ fontSize: '1rem', fontWeight: '600', color: '#fca5a5', marginBottom: '0.5rem' }}>
                      ⏰ Important Information:
                    </p>
                    <ul style={{
                      fontSize: '0.95rem',
                      color: 'rgba(255, 255, 255, 0.9)',
                      paddingLeft: '0rem',
                      lineHeight: '1.5',
                      margin: 0
                    }}>
                      <li style={{ marginBottom: '0.25rem' }}>
                        • Your account will be <strong>permanently deleted in 7 days</strong>.
                      </li>
                      <li style={{ marginBottom: '0.25rem' }}>
                        • All your mood data and personal information will be removed.
                      </li>
                      <li style={{ marginBottom: '0.25rem' }}>
                        • You can <strong>cancel this request anytime</strong> by logging into Moodly before the 7-day period expires.
                      </li>
                      <li style={{ marginBottom: '0.25rem' }}>
                        • A confirmation email will be sent to you shortly.
                      </li>
                    </ul>
                  </div>

                  <form onSubmit={handleInitialSubmission}>
                    {/* Deletion Reason Dropdown */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontWeight: '500',
                        color: 'rgba(255, 255, 255, 0.9)'
                      }}>
                        Why are you leaving us? <span style={{ color: '#fca5a5' }}>*</span>
                      </label>
                      <select
                        value={deletionReason}
                        onChange={(e) => setDeletionReason(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'white',
                          fontSize: '0.9rem',
                          fontWeight: deletionReason ? '500' : '400',
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        <option value="" style={{ backgroundColor: '#1a1a1a', color: 'rgba(255, 255, 255, 0.7)' }}>Please select a reason</option>
                        <option value="Not Useful" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>Not Useful</option>
                        <option value="Found Better Alternative" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>Found Better Alternative</option>
                        <option value="Privacy Concerns" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>Privacy Concerns</option>
                        <option value="Too Complicated" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>Too Complicated</option>
                        <option value="Other" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>Other</option>
                      </select>
                    </div>

                    {/* Password Confirmation */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontWeight: '500',
                        color: 'rgba(255, 255, 255, 0.9)'
                      }}>
                        Enter your password to confirm: <span style={{ color: '#fca5a5' }}>*</span>
                      </label>
                      <input
                        type="password"
                        value={deletionPassword}
                        onChange={(e) => setDeletionPassword(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'white',
                          fontSize: '0.875rem',
                          backdropFilter: 'blur(10px)'
                        }}
                        placeholder="Enter your password"
                      />
                    </div>

                    {/* Error Messages */}
                    {errors.deletion && (
                      <p style={{ color: '#fca5a5', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: '500' }}>
                        ❌ {errors.deletion}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDeletionConfirm(false);
                          setShowFinalConfirmation(false);
                          setDeletionPassword('');
                          setDeletionReason('');
                          setErrors({});
                        }}
                        disabled={isLoading}
                        style={{
                          padding: '0.6rem 1.25rem',
                          backgroundColor: '#6b7280',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: isLoading ? 'not-allowed' : 'pointer',
                          opacity: isLoading ? 0.5 : 1
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading || !deletionReason || !deletionPassword}
                        style={{
                          padding: '0.6rem 1.25rem',
                          backgroundColor: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: (isLoading || !deletionReason || !deletionPassword) ? 'not-allowed' : 'pointer',
                          opacity: (isLoading || !deletionReason || !deletionPassword) ? 0.5 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        {isLoading ? (
                          <>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              border: '2px solid transparent',
                              borderTop: '2px solid white',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }} />
                            Processing...
                          </>
                        ) : (
                          '🗑️ Yes, Delete My Account'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* CSS Animation for Loading Spinner */}
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>

        </div>
      </div>
      {/* Settings Load Error Toast */}
      {!user && (
  <div
    style={{
      position: 'fixed',
      bottom: '24px',
      left: '24px',
      zIndex: 9999,
      maxWidth: '384px',
      minWidth: '300px',
      transform: showSettingsToast ? 'translateX(0)' : 'translateX(-120%)',
      opacity: showSettingsToast ? 1 : 0, 
      transition: 'all 500ms ease-in-out',
      backgroundColor: '#ef4444',
      color: 'white',
      padding: '16px 24px',
      borderRadius: '8px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>Error</div>
        <div style={{ fontSize: '14px' }}>Unable to load User Settings</div>
      </div>
      <button
        onClick={handleCloseToast}
        style={{
          marginLeft: '16px',
          color: 'white',
          fontSize: '20px',
          fontWeight: 'bold',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0',
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
      >
        ×
      </button>
    </div>
  </div>
)}
    </div>
  );
};

export default SettingsPage;