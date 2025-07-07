// src/App.tsx
import { useState, useEffect } from 'react';
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
  // ADDED: API status tracking for error handling and loading states
  const [apiStatus, setApiStatus] = useState<'loading' | 'healthy' | 'error'>('loading');
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  // Current page state
  const [currentPage, setCurrentPage] = useState('home');

  const [currentMoodData, setCurrentMoodData] = useState<{mood: string, timestamp: number} | null>(null);

  // Load mood history from localStorage on initial render
    useEffect(() => {
    const initializeApp = async () => {
      
      // Check for auth state using token
      const token = localStorage.getItem('authToken');
      if (token) {
        setIsAuthenticated(true);
        setCurrentPage('home');
        
        // ADDED: Fetch last mood from API for authenticated users
        try {
          const lastMood = await moodApiService.getLastMood();
          if (lastMood) {
            setCurrentMoodData({
              mood: lastMood.mood,
              timestamp: new Date(lastMood.createdAt).getTime()
            });
          }
          // ADDED: Mark API as healthy after successful call
          setApiStatus('healthy');
        } catch (error) {
          console.error('Failed to fetch last mood:', error);
          // ADDED: Mark API as error if initial mood fetch fails
          setApiStatus('error');
        }
      } else {
        setIsAuthenticated(false);
        setCurrentPage('landing');
        // ADDED: For unauthenticated users, API status is healthy (no mood API needed)
        setApiStatus('healthy');
      }
    };

    initializeApp();
  }, []);

  // Handle navigation
  const handleNavigate = (page: string) => {
    // Special cases for auth-related navigation
    if (page === 'logout') {
      setIsAuthenticated(false);
      // Remove token and user data
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      setCurrentPage('landing');
      return;
    }
    
    // Normal navigation
    setCurrentPage(page);
  };

  // Handle mood selection
  const handleSelectMood = async(mood: string) => {
    try {
      await moodApiService.createMood(mood);
      
      // ADDED: Update local state after successful API call
      setCurrentMoodData({
        mood,
        timestamp: Date.now()
      });
      
      console.log('Mood saved successfully:', mood);
    } catch (error) {
      console.error('Failed to save mood:', error);
      // ADDED: Let MoodSelector component handle this error (will be thrown to component)
      throw error;
    }
  };

  // Get the most recently selected mood (or null if none)
  const getCurrentMood = () => {
    return currentMoodData?.mood || null;
  };

  // Temporary content display for testing
  const renderContent = () => {
     // ADDED: Handle API error state for authenticated users - show error screen if mood API failed
     if (isAuthenticated && apiStatus === 'error') {
      return <ErrorScreen />;
    }
    
    // ADDED: Handle loading state for authenticated users - show loading while fetching initial mood data
    if (isAuthenticated && apiStatus === 'loading') {
      return (
        <div className="text-center py-12">
          <div className="text-2xl">Loading your mood data...</div>
        </div>
      );
    }

    if (currentPage === 'globe') {
      return <GlobePage />;
    }
    if (!isAuthenticated) {
      // NEW: Show LandingPage component for landing page
      if (currentPage === 'landing') {
        return <LandingPage onNavigate={handleNavigate} />;
      }
  
      // NEW: Show specific pages based on currentPage
      if (currentPage === 'signup') {
        return <SignUpPage onNavigate={handleNavigate} />;
      }
  
      if (currentPage === 'login') {
        return <LoginPage onNavigate={handleNavigate} />;
      }
      if (currentPage === 'privacy-and-terms') {
        return <PrivacyAndTermsPage onNavigate={handleNavigate} />;
      }
  
      // For other unimplemented pages, show placeholder
      return (
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-6">Page: {currentPage}</h1>
          <p>This page will be implemented later</p>
        </div>
      );
    } else {
      // Authenticated users logic with 10-minute rule
      if (currentPage === 'you') {
        const currentMood = getCurrentMood();
        const hasRecentMood = currentMood && currentMoodData ? 
          isWithin10Minutes(currentMoodData.timestamp) : false;
          
        return <UserDashboard currentMood={currentMood} hasRecentMood={hasRecentMood} />;
      }
      if(currentPage === 'settings') {
        return <SettingsPage />;
      }
      const currentMood = getCurrentMood();
      
      // Check if user has recent mood (within 10 minutes)
       if (currentMood && currentMoodData) {
        const lastMoodTimestamp = currentMoodData.timestamp;
        
        if (isWithin10Minutes(lastMoodTimestamp)) {
          // Show mood selected screen (within 10 minutes)
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
          selectedMood={currentMood}
          onSelectMood={handleSelectMood}
        />
      );
    }
  };

  return (
    <div>
      {/* Render appropriate navbar based on auth state */}
      {currentPage !== 'signup' && currentPage !== 'login' && (isAuthenticated ? (
        <AuthenticatedNavbar onNavigate={handleNavigate} currentPage={currentPage} />
      ) : (
        <PublicNavbar onNavigate={handleNavigate} currentPage={currentPage} />
      ))}
      
      {/* Main content area */}
      <div>
        <div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default App;