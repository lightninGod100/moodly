// src/components/SettingsPage.tsx
import { settingsApiService } from '../services/SettingsService';
import React, { useState, useEffect } from 'react';
import type { UserSettings, PasswordChangeRequest, CountryUpdateRequest, PhotoUploadRequest, AccountDeletionRequest } from '../services/SettingsService';
import { useUser } from '../contexts/UserContext';

const SettingsPage: React.FC = () => {
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
  // Load user settings from API
// Initialize form with context data
const initializeForm = () => {
  if (user) {
    setSelectedCountry(user.country);
  }
};

  // Load data on component mount
  // Initialize form when user data is available
  useEffect(() => {
    initializeForm();
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



  // Show error state if failed to load data
  if (!user) {
    return (
      <div style={{ backgroundColor: 'white', minHeight: '100vh', padding: '2rem' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', paddingTop: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', color: 'black' }}>
            Account Settings
          </h1>
          <div style={{ padding: '1rem', border: '1px solid #dc2626', borderRadius: '8px', backgroundColor: '#fef2f2' }}>
            <p style={{ color: '#dc2626', marginBottom: '1rem' }}>
              {'Failed to load your settings'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Helper functions
  const clearMessages = () => {
    setErrors({});
    setSuccessMessages({});
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
    if (!user.canChangeCountry) {
      const nextDate = user.nextCountryChangeDate
        ? new Date(user.nextCountryChangeDate).toLocaleDateString()
        : 'Unknown';
      setErrors({ country: `Country can only be changed once per month. Next change: ${nextDate}` });
      return;
    }

    if (selectedCountry === user.country) {
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

  // Handle account deletion with real API
  const handleAccountDeletion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!deletionPassword) {
      setErrors({ deletion: 'Password is required to delete account' });
      return;
    }

    try {
      setIsLoading(true);

      const accountData: AccountDeletionRequest = {
        password: deletionPassword
      };

      const message = await settingsApiService.deleteAccount(accountData);

      const deletionTimestamp = Date.now() + (7 * 24 * 60 * 60 * 1000);

      dispatch({ 
        type: 'MARK_FOR_DELETION', 
        payload: { markForDeletion: true, deletionTimestamp: deletionTimestamp }
      });
      alert(message);
      setShowDeletionConfirm(false);
      setDeletionPassword('');

      // Reload user settings to update markForDeletion status
      

    } catch (error) {
      setErrors({ deletion: error instanceof Error ? error.message : 'Failed to delete account' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
    <div style={{ backgroundColor: 'white', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>

        {/* Header */}
        <h1 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', color: 'black' }}>
          Account Settings
        </h1>

        {/* Profile Photo Section */}
        <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'black', textAlign: 'center' }}>
            Profile Photo
          </h3>

          {/* Centered Photo Display Container */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Current Photo Display */}
            <div
              style={{ position: 'relative', marginBottom: '1rem' }}
              onMouseEnter={() => setIsPhotoHovered(true)}
              onMouseLeave={() => setIsPhotoHovered(false)}
            >
              {user.profilePhoto ? (
                <>
                  <img
                    src={user.profilePhoto}
                    alt="Profile"
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      border: '2px solid #e5e7eb',
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
                  backgroundColor: '#f3f4f6',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed #d1d5db'
                }}>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>No Photo</span>
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
            <p style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'center', marginBottom: '0.5rem' }}>
              PNG or JPEG only, max 100KB, max 256×256px
            </p>

            {/* Error and Success Messages */}
            {errors.photo && (
              <p style={{ color: '#dc2626', fontSize: '0.875rem', textAlign: 'center' }}>
                {errors.photo}
              </p>
            )}
            {successMessages.photo && (
              <p style={{ color: '#16a34a', fontSize: '0.875rem', textAlign: 'center' }}>
                {successMessages.photo}
              </p>
            )}
          </div>
        </div>

        {/* Basic Information */}
        <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'black' }}>
            Basic Information
          </h3>

          {/*username*/}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'black' }}>
              Username
            </label>
            <input
              type="text"
              value={user.username}
              disabled
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: '#f9fafb',
                color: '#6b7280'
              }}
            />
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Username cannot be changed
            </p>
          </div>


          {/* Email - Read Only */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'black' }}>
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: '#f9fafb',
                color: '#6b7280'
              }}
            />
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Email cannot be changed
            </p>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'black' }}>
              Gender
            </label>
            <input
              type="text"
              value={user.gender}
              disabled
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: '#f9fafb',
                color: '#6b7280'
              }}
            />
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Gender cannot be changed
            </p>
          </div>
        </div>

        {/* Country Section */}
        <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'black' }}>
            Country
          </h3>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'black' }}>
              Current Country
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              disabled={!user.canChangeCountry}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: user.canChangeCountry ? 'white' : '#f9fafb',
                color: user.canChangeCountry ? 'black' : '#6b7280'
              }}
            >
              {countries.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>

            {!user.canChangeCountry && user.nextCountryChangeDate && (
              <p style={{ fontSize: '0.875rem', color: '#f59e0b', marginTop: '0.5rem' }}>
                Next change available: {new Date(user.nextCountryChangeDate).toLocaleDateString('en-GB')}
              </p>
            )}

            {user.canChangeCountry && selectedCountry !== user.country && (
              <button
                onClick={handleCountryChange}
                disabled={isLoading}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  opacity: isLoading ? 0.5 : 1
                }}
              >
                {isLoading ? 'Updating...' : 'Update Country'}
              </button>
            )}

            {errors.country && <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errors.country}</p>}
            {successMessages.country && <p style={{ color: '#16a34a', fontSize: '0.875rem', marginTop: '0.5rem' }}>{successMessages.country}</p>}
          </div>
        </div>

        {/* Change Password Section */}
        <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'black' }}>
            Change Password
          </h3>

          <form onSubmit={handlePasswordChange}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'black' }}>
                Current Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwords.current}
                  onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem', paddingRight: '3rem', border: '1px solid #ccc', borderRadius: '4px' }}
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
                    color: '#6b7280',
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

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'black' }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwords.new}
                  onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem', paddingRight: '3rem', border: '1px solid #ccc', borderRadius: '4px' }}
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
                    color: '#6b7280',
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

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'black' }}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                placeholder="Confirm new password"
              />
            </div>

            {errors.password && <p style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' }}>{errors.password}</p>}
            {successMessages.password && <p style={{ color: '#16a34a', fontSize: '0.875rem', marginBottom: '1rem' }}>{successMessages.password}</p>}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                opacity: isLoading ? 0.5 : 1
              }}
            >
              {isLoading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Account Deletion Section */}
        <div style={{ padding: '1rem', border: '2px solid #dc2626', borderRadius: '8px', backgroundColor: '#fef2f2' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#dc2626' }}>
            Danger Zone
          </h3>

          {user.markForDeletion ? (
            <div>
              <p style={{ fontSize: '0.875rem', color: '#dc2626', marginBottom: '1rem', fontWeight: 'bold' }}>
  ⚠️ Your account has been marked for deletion and will be permanently deleted in next 7 days.
</p>
<p style={{ fontSize: '0.875rem', color: '#16a34a', marginBottom: '1rem', fontWeight: 'bold' }}>
  ✅  You can cancel this request anytime by logging into Moodly before {user.deletionTimestamp ? new Date(user.deletionTimestamp).toLocaleDateString('en-GB') : 'Unknown Date'}.


  
</p>
            </div>
          ) : !showDeletionConfirm ? (
            <div>
              <p style={{ fontSize: '0.875rem', color: 'black', marginBottom: '1rem' }}>
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button
                onClick={() => setShowDeletionConfirm(true)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px'
                }}
              >
                Delete Account
              </button>
            </div>
          ) : (
            <form onSubmit={handleAccountDeletion}>
              <p style={{ fontSize: '0.875rem', color: 'black', marginBottom: '1rem' }}>
                <strong>Are you sure you want to delete your account?</strong> This action cannot be undone.
              </p>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'black' }}>
                  Enter your password to confirm:
                </label>
                <input
                  type="password"
                  value={deletionPassword}
                  onChange={(e) => setDeletionPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                  placeholder="Enter your password"
                />
              </div>

              {errors.deletion && <p style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' }}>{errors.deletion}</p>}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeletionConfirm(false);
                    setDeletionPassword('');
                    setErrors({});
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    opacity: isLoading ? 0.5 : 1
                  }}
                >
                  {isLoading ? 'Deleting...' : 'Yes, Delete My Account'}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>


   
    </div>
  );
};

export default SettingsPage;