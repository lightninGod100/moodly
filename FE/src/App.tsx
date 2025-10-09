// src/App.tsx
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from './constants/routes';

import MoodSelector from './components/MoodSelector';
import AuthenticatedNavbar from './components/AuthenticatedNavbar';
import PublicNavbar from './components/PublicNavbar';
// NEW: Import the LandingPage component
import LandingPage from './components/LandingPage';
import SignUpPage from './components/SignUpPage';
import LoginPage from './components/LoginPage';
import MoodSelectedScreen from './components/MoodSelectedScreen';
import GlobePage from './components/GlobePage';
import UserDashboard from './components/UserDashboard';
import ErrorScreen from './components/ErrorScreen';
// ADDED: Import mood API service for backend integration
import { moodApiService } from './services/MoodService';
// Define a type for mood entries with timestamps
import PrivacyAndTermsPage from './components/PrivacyAndTermsPage';
import SettingsPage from './components/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';

import { UserProvider, useUser } from './contexts/UserContext';
import { settingsApiService } from './services/SettingsService';
// Add this import
import { authApiService } from './services/AuthService';

import { deviceService } from './services/DeviceService';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import NotificationToast from './components/NotificationToast';
// Add this import with your other service imports
// Add these imports after your api import
import { notificationBridge } from './services/NotificationBridge';



interface MoodCacheData {
  mood: string;
  timestamp: number;      // When mood was created
  lastApiFetch: number;   // When API was last called
}

//Helper function to check if timestamp is within 10 minutes
const isWithin10Minutes = (timestamp: number): boolean => {
  const now = Date.now();
  const tenMinutesInMs = 10 * 60 * 1000; // 10 minutes in milliseconds
  return (now - timestamp) <= tenMinutesInMs;
};

//Helper function to get mood emoji
const getMoodEmoji = (mood: string): string => {
  const moodEmojis: Record<string, string> = {
    'Excited': '😃',
    'Happy': '😊',
    'Calm': '😌',
    'Tired': '😴',
    'Anxious': '😰',
    'Angry': '😠',
    'Sad': '😢'
  };
  return moodEmojis[mood] || '😐';
};

function App() {

  return (
    <UserProvider>
      <NotificationProvider>
        <AppContent />
        <NotificationToast />
      </NotificationProvider>
    </UserProvider>
  );
}

function AppContent() {
  const { dispatch } = useUser();
  const { showNotification } = useNotification();
  // ADDED: API status tracking for error handling and loading states
  const [apiStatus, setApiStatus] = useState<'loading' | 'healthy' | 'error'>('loading');
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentMoodData, setCurrentMoodData] = useState<MoodCacheData | null>(null);
  const [moodError, setMoodError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // ADD routing hooks
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    notificationBridge.setHandler(showNotification);
    console.log('NotificationBridge initialized');
    
    return () => {
      notificationBridge.clearHandler();
    };
  }, [showNotification]);
  // Load mood history from localStorage on initial render
  // Add this useEffect for one-time auth verification (runs only on mount)
  useEffect(() => {
    const initializeApp = async () => {
      setApiStatus('loading');
      setIsAuthLoading(true); // Explicitly set, though already true

      try {
        // Device service initialization
        await deviceService.initialize();
        console.log('✅ Device tracking initialized');
      } catch (error) {
        console.warn('Device service initialization failed:', error);
      }

      authApiService.initializeLogoutRetry();

      try {
        // Verify authentication
        const username = await authApiService.verifyAuth();

        if (username) {
          setIsAuthenticated(true);

          // Try to fetch user settings
          try {
            const userSettings = await settingsApiService.getUserSettings();
            dispatch({ type: 'SET_USER', payload: userSettings });
          } catch (error) {
            console.warn('Failed to fetch user settings from server');
            showNotification({
              type: 'error',
              message: 'Unable to load user settings'
            });
          }

          // Load last mood from cache/API
          const stored = localStorage.getItem('latestMoodData');
          if (stored) {
            try {
              const cachedData: MoodCacheData = JSON.parse(stored);
              setCurrentMoodData(cachedData);

              const apiAge = Date.now() - (cachedData.lastApiFetch || 0);
              const isApiDataFresh = apiAge <= (10 * 60 * 1000);

              if (isApiDataFresh) {
                console.log('Using cached data, API called recently');
                setApiStatus('healthy');
                return;
              }
            } catch (e) {
              console.error('Invalid cached mood data');
              localStorage.removeItem('latestMoodData');
            }
          }

          // Fetch fresh mood data if needed
          moodApiService.getLastMood()
            .then(lastMood => {
              if (lastMood) {
                const moodData: MoodCacheData = {
                  mood: lastMood.mood,
                  timestamp: parseInt(lastMood.createdAt),
                  lastApiFetch: Date.now()
                };
                setCurrentMoodData(moodData);
                localStorage.setItem('latestMoodData', JSON.stringify(moodData));
              }
            })
            .catch(() => {
              console.warn('Could not load last mood from server');
              showNotification({
                type: 'error',
                message: 'Unable to load recent mood data'
              });
            });
          setApiStatus('healthy');
        } else {
          setIsAuthenticated(false);
          setApiStatus('healthy');
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        setIsAuthenticated(false);
        setApiStatus('healthy');
      } finally {
        // CRITICAL: Always set auth loading to false
        setIsAuthLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Separate useEffect for auth expiry handling
  useEffect(() => {
    const handleAuthExpired = () => {
      setIsAuthenticated(false);
      setCurrentMoodData(null);
      localStorage.clear();
      navigate(ROUTES.LANDING);
    };

    window.addEventListener('auth:expired', handleAuthExpired);

    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, [navigate]); // Only depend on navigate


  // Handle navigation
  const handleNavigate = (page: string) => {
    // Special cases for auth-related navigation
    if (page === 'logout') {
      // Call AuthService logout (which will handle backend logging + local cleanup)
      authApiService.logout().then(() => {
        setIsAuthenticated(false);
        localStorage.clear();
        navigate(ROUTES.LANDING);
        return;

      }).catch(() => {
        // Even if logout API fails, clear local state
        setIsAuthenticated(false);
        navigate(ROUTES.LANDING);
        localStorage.clear();
      });
      return;
    }

    // Map page names to routes
    const routeMap: Record<string, string> = {
      'landing': ROUTES.LANDING,
      'login': ROUTES.LOGIN,
      'signup': ROUTES.SIGNUP,
      'mood': ROUTES.MOOD,
      'dashboard': ROUTES.DASHBOARD,
      'globe': ROUTES.GLOBE,
      'settings': ROUTES.SETTINGS,
      'privacy-and-terms': ROUTES.PRIVACY
    };
    if (routeMap[page]) {
      navigate(routeMap[page]);
    }
  };

  // Helper to get current page for navbars
  const getCurrentPage = (): string => {
    const path = location.pathname;
    if (path === ROUTES.MOOD) return 'mood';
    if (path === ROUTES.DASHBOARD) return 'dashboard';
    if (path === ROUTES.GLOBE) return 'globe';
    if (path === ROUTES.SETTINGS) return 'settings';
    if (path === ROUTES.LOGIN) return 'login';
    if (path === ROUTES.SIGNUP) return 'signup';
    if (path === ROUTES.PRIVACY) return 'privacy-and-terms';
    return 'landing';
  };
  // Handle mood selection
  const handleSelectMood = async (mood: string) => {
    localStorage.removeItem('mood_selected_stats_all');
    try {
      await moodApiService.createMood(mood);

      // ADDED: Update local state after successful API call

      // ADDED: Update local state after successful API call
      const newMoodData: MoodCacheData = {
        mood,
        timestamp: Date.now(),
        lastApiFetch: Date.now()
      };
      setCurrentMoodData(newMoodData);
      // ADDED: Save to localStorage as backup
      localStorage.setItem('latestMoodData', JSON.stringify(newMoodData));
      console.log('Mood saved successfully:', mood);

    } catch (error) {
      console.warn('Failed to save mood:');
      const userMessage = error instanceof Error ? error.message : 'Something went wrong';
      // ADDED: Let MoodSelector component handle this error (will be thrown to component)
      setMoodError(userMessage);
    }
  };

  // Get the most recently selected mood (or null if none)
  const getCurrentMood = () => {
    return currentMoodData?.mood || null;
  };

  // content display for testing
  // const renderContent = () => {
  //   // ADDED: Handle API error state for authenticated users - show error screen if mood API failed
  //   if (isAuthenticated && apiStatus === 'error') {
  //     return <ErrorScreen />;
  //   }

  //   // ADDED: Handle loading state for authenticated users - show loading while fetching initial mood data
  //   if (isAuthenticated && apiStatus === 'loading') {
  //     return (
  //       <div className="text-center py-12">
  //         <div className="text-2xl">Loading your mood data...</div>
  //       </div>
  //     );
  //   }

  //   if (getCurrentPage() === 'globe') {
  //     return <GlobePage />;
  //   }
  //   if (getCurrentPage() === 'privacy-and-terms') {
  //     return <PrivacyAndTermsPage onNavigate={handleNavigate} />;
  //   }
  //   if (!isAuthenticated) {
  //     // NEW: Show LandingPage component for landing page
  //     if (getCurrentPage() === 'landing') {
  //       return <LandingPage onNavigate={handleNavigate} />;
  //     }

  //     // NEW: Show specific pages based on currentPage
  //     if (getCurrentPage() === 'signup') {
  //       return <SignUpPage onNavigate={handleNavigate} />;
  //     }

  //     if (getCurrentPage() === 'login') {
  //       return <LoginPage onNavigate={handleNavigate} />;
  //     }


  //     // For other unimplemented pages, show placeholder
  //     return (
  //       <div className="text-center py-12">
  //         <h1 className="text-3xl font-bold mb-6">Page: {getCurrentPage()}</h1>
  //         <p>This page will be implemented later</p>
  //       </div>
  //     );
  //   } else {
  //     // Authenticated users logic with 10-minute rule
  //     if (getCurrentPage() === 'dashboard') {
  //       const currentMood = getCurrentMood();
  //       const hasRecentMood = currentMood && currentMoodData ?
  //         isWithin10Minutes(currentMoodData.timestamp) : false;

  //       return <UserDashboard currentMood={currentMood} hasRecentMood={hasRecentMood} onNavigate={handleNavigate} />;
  //     }
  //     if (getCurrentPage() === 'settings') {
  //       return <SettingsPage />;
  //     }
  //     const currentMood = getCurrentMood();

  //     // Check if user has recent mood (within 10 minutes)
  //     if (currentMood && currentMoodData) {
  //       const lastMoodTimestamp = currentMoodData.timestamp;

  //       if (isWithin10Minutes(lastMoodTimestamp)) {
  //         // Show mood selected screen (within 10 minutes)
  //         return (
  //           <MoodSelectedScreen
  //             currentMood={currentMood}
  //             moodEmoji={getMoodEmoji(currentMood)}
  //           />
  //         );
  //       }
  //     }

  //     // Show mood selector (no recent mood or > 10 minutes ago)
  //     return (
  //       <MoodSelector
  //         selectedMood={null}
  //         onSelectMood={handleSelectMood}
  //         error={moodError}
  //         onClearError={() => setMoodError(null)}
  //       />
  //     );
  //   }
  // };

  return (
    <div>
      {/* Keep your navbar logic EXACTLY as it is, just use getCurrentPage() */}
      {getCurrentPage() !== 'login' && getCurrentPage() !== 'signup' && (
        isAuthenticated ? (
          <AuthenticatedNavbar
            onNavigate={handleNavigate}
            currentPage={getCurrentPage()}
          />
        ) : (
          <PublicNavbar
            onNavigate={handleNavigate}
            currentPage={getCurrentPage()}
          />
        )
      )}

      {/* Routes instead of renderContent() */}
      {/* Routes instead of renderContent() */}
      <div >
        <div>

        {isAuthLoading ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-2xl">Loading...</div>
          </div>
        ) : (
          <>
            {/* Show loading/error states globally */}
            {isAuthenticated && apiStatus === 'error' ? (
              <ErrorScreen />
            ) : isAuthenticated && apiStatus === 'loading' ? (
              <div className="text-center py-12">
                <div className="text-2xl">Loading your mood data...</div>
              </div>
            ) : (
              <Routes>
              {/* Public Routes */}
              <Route path={ROUTES.LANDING} element={
                isAuthenticated ? <Navigate to={ROUTES.MOOD} replace /> : <LandingPage onNavigate={handleNavigate} />
              } />

              <Route path={ROUTES.LOGIN} element={
                isAuthenticated ? <Navigate to={ROUTES.MOOD} replace /> : <LoginPage onNavigate={handleNavigate} />
              } />

              <Route path={ROUTES.SIGNUP} element={
                isAuthenticated ? <Navigate to={ROUTES.MOOD} replace /> : <SignUpPage onNavigate={handleNavigate} />
              } />

              <Route path={ROUTES.PRIVACY} element={
                <PrivacyAndTermsPage onNavigate={handleNavigate} />
              } />

              <Route path={ROUTES.GLOBE} element={<GlobePage />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
                <Route path={ROUTES.MOOD} element={
                  (() => {
                    const currentMood = getCurrentMood();
                    // Check if user has recent mood (within 10 minutes)
                    if (currentMood && currentMoodData) {
                      const lastMoodTimestamp = currentMoodData.timestamp;
                      if (isWithin10Minutes(lastMoodTimestamp)) {
                        return (
                          <MoodSelectedScreen
                            currentMood={currentMood}
                            moodEmoji={getMoodEmoji(currentMood)}
                          />
                        );
                      }
                    }
                    // Show mood selector (no recent mood or > 10 minutes ago)
                    return (
                      <MoodSelector
                        selectedMood={null}
                        onSelectMood={handleSelectMood}
                        error={moodError}
                        onClearError={() => setMoodError(null)}
                      />
                    );
                  })()
                } />

                <Route path={ROUTES.DASHBOARD} element={
                  (() => {
                    const currentMood = getCurrentMood();
                    const hasRecentMood = currentMood && currentMoodData ?
                      isWithin10Minutes(currentMoodData.timestamp) : false;
                    return <UserDashboard currentMood={currentMood} hasRecentMood={hasRecentMood} />;
                  })()
                } />

                <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
              </Route>

              {/* Catch all - redirect to appropriate page */}
              <Route path="*" element={
                <Navigate to={isAuthenticated ? ROUTES.MOOD : ROUTES.LANDING} replace />
              } />
              </Routes>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
}

export default App;