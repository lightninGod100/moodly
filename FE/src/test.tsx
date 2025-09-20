// FE/src/App.tsx

import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from './constants/routes';

// Import all components
import MoodSelector from './components/MoodSelector';
import AuthenticatedNavbar from './components/AuthenticatedNavbar';
import PublicNavbar from './components/PublicNavbar';
import LandingPage from './components/LandingPage';
import SignUpPage from './components/SignUpPage';
import LoginPage from './components/LoginPage';
import MoodSelectedScreen from './components/MoodSelectedScreen';
import GlobePage from './components/GlobePage';
import UserDashboard from './components/UserDashboard';
import ErrorScreen from './components/ErrorScreen';
import PrivacyAndTermsPage from './components/PrivacyAndTermsPage';
import SettingsPage from './components/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';

import { moodApiService } from './services/MoodService';
import { UserProvider, useUser } from './contexts/UserContext';
import { settingsApiService } from './services/SettingsService';
import { authApiService } from './services/AuthService';

interface MoodCacheData {
  mood: string;
  timestamp: number;
  lastApiFetch: number;
}

const isWithin10Minutes = (timestamp: number): boolean => {
  const now = Date.now();
  const tenMinutesInMs = 10 * 60 * 1000;
  return (now - timestamp) <= tenMinutesInMs;
};

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
  return moodEmojis[mood] || '😊';
};

// New component to handle mood page logic
function MoodPage() {
  const [latestMoodData, setLatestMoodData] = useState<MoodCacheData | null>(null);
  const [apiStatus, setApiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [moodError, setMoodError] = useState<string>('');

  useEffect(() => {
    const fetchInitialMood = async () => {
      setApiStatus('loading');
      try {
        // Use correct method name: getLastMood()
        const lastMoodResponse = await moodApiService.getLastMood();
        if (lastMoodResponse && lastMoodResponse.mood) {
          // Convert createdAt string to timestamp
          const timestamp = parseInt(lastMoodResponse.createdAt);
          setLatestMoodData({
            mood: lastMoodResponse.mood,
            timestamp: timestamp,
            lastApiFetch: Date.now()
          });
          localStorage.setItem('lastestMoodData', JSON.stringify(latestMoodData));
        }
        //setNotificationError(null);
        setApiStatus('success');
      } catch (error) {
        console.warn('Could not load last mood from server');
        //setNotificationError('lastMood'); // Always show sync error
      }
    };

    fetchInitialMood();
  }, []);

  const handleSelectMood = async (mood: string) => {
    localStorage.removeItem('mood_selected_stats_all');
    
    setApiStatus('loading');
    
    try {
      // Use correct method name: createMood()
      const response = await moodApiService.createMood(mood);
      
      // Convert createdAt string to timestamp
      const timestamp = new Date(response.createdAt).getTime();
      setLatestMoodData({
        mood: response.mood,
        timestamp: timestamp,
        lastApiFetch: Date.now()
      });
      
      setApiStatus('success');
      setMoodError('');
    } catch (error: any) {
      console.warn('Failed to save mood:');
      const userMessage = error instanceof Error ? error.message : 'Something went wrong';
      // ADDED: Let MoodSelector component handle this error (will be thrown to component)
      setMoodError(userMessage);
    }
  };

  const getCurrentMood = () => {
    return latestMoodData?.mood || null;
  };

  // Handle API error state
  if (apiStatus === 'error' && !latestMoodData) {
    return <ErrorScreen />;
  }

  // Handle loading state
  if (apiStatus === 'loading' && !latestMoodData) {
    return (
      <div className="text-center py-12">
        <div className="text-2xl">Loading your mood data...</div>
      </div>
    );
  }

  // Apply 10-minute rule
  const currentMood = getCurrentMood();
    const hasRecentMood = currentMood && latestMoodData ? 
    isWithin10Minutes(latestMoodData.timestamp) : false;

  if (hasRecentMood) {
    return (
      <MoodSelectedScreen 
        currentMood={currentMood!}
        moodEmoji={getMoodEmoji(currentMood!)}
      />
    );
  }

  return (
    <MoodSelector
      selectedMood={currentMood}
      onSelectMood={handleSelectMood}
      error={moodError}
      onClearError={() => setMoodError('')}
    />
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const username = await authApiService.verifyAuth();
        if (username) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Helper function to get current page from path
  const getCurrentPageFromPath = (): string => {
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

  return (
    <UserProvider>
      <div className="min-h-screen flex flex-col">
        {/* Render appropriate navbar based on auth state */}
        {isAuthenticated ? (
          <AuthenticatedNavbar 
            onNavigate={(page) => {
              if (page === 'logout') {
                setIsAuthenticated(false);
                navigate(ROUTES.LANDING);
              } else if (page === 'mood') {
                navigate(ROUTES.MOOD);
              } else if (page === 'dashboard') {
                navigate(ROUTES.DASHBOARD);
              } else if (page === 'globe') {
                navigate(ROUTES.GLOBE);
              } else if (page === 'settings') {
                navigate(ROUTES.SETTINGS);
              }
            }} 
            currentPage={getCurrentPageFromPath()} 
          />
        ) : (
          <PublicNavbar 
            onNavigate={(page) => {
              if (page === 'landing') navigate(ROUTES.LANDING);
              else if (page === 'login') navigate(ROUTES.LOGIN);
              else if (page === 'signup') navigate(ROUTES.SIGNUP);
            }} 
            currentPage={getCurrentPageFromPath()} 
          />
        )}

        {/* Main content area with routing */}
        <div className="flex-1 flex justify-center items-start pt-12">
          <div className="w-full max-w-4xl px-4">
            <Routes>
              {/* Root route - conditional based on auth */}
              <Route path={ROUTES.LANDING} element={
                isAuthenticated ? <Navigate to={ROUTES.MOOD} replace /> : <LandingPage />
              } />

              {/* Public routes */}
              <Route path={ROUTES.LOGIN} element={
                isAuthenticated ? <Navigate to={ROUTES.MOOD} replace /> : <LoginPage />
              } />
              <Route path={ROUTES.SIGNUP} element={
                isAuthenticated ? <Navigate to={ROUTES.MOOD} replace /> : <SignUpPage />
              } />
              <Route path={ROUTES.PRIVACY} element={<PrivacyAndTermsPage />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
                <Route path={ROUTES.MOOD} element={<MoodPage />} />
                <Route path={ROUTES.DASHBOARD} element={<UserDashboard />} />
                <Route path={ROUTES.GLOBE} element={<GlobePage />} />
                <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
              </Route>

              {/* Catch all - redirect to landing */}
              <Route path="*" element={<Navigate to={ROUTES.LANDING} replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </UserProvider>
  );
}

export default App;