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
// Define a type for mood entries with timestamps
type MoodEntry = {
  mood: string;
  timestamp: number;
};

//Helper function to check if timestamp is within 10 minutes
const isWithin10Minutes = (timestamp: number): boolean => {
  const now = Date.now();
  const tenMinutesInMs = 0.15 * 60 * 1000; // 10 minutes in milliseconds
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
  return moodEmojis[mood] || '😐';
};

// Key for localStorage
const LOCAL_STORAGE_KEY = 'moodHistory';

function App() {
  // Store mood history with timestamps
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  // Current page state
  const [currentPage, setCurrentPage] = useState('home');

  // Load mood history from localStorage on initial render
  useEffect(() => {
    const storedHistory = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedHistory) {
      setMoodHistory(JSON.parse(storedHistory));
    }
    
    // Check for auth state using token
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
      setCurrentPage('home');
    } else {
      setIsAuthenticated(false);
      setCurrentPage('landing');
    }
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
  const handleSelectMood = (mood: string) => {
    // Create new mood entry with current timestamp
    console.log('Mood selected:', mood);
    console.log('Current mood history before update:', moodHistory);

    const newEntry = {
      mood,
      timestamp: Date.now()
    };
    console.log('New mood entry:', newEntry);
    // Update mood history
    const updatedHistory = [...moodHistory, newEntry];
    setMoodHistory(updatedHistory);
    
    console.log('Updated mood history:', updatedHistory);

    // Save to localStorage
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedHistory));
  };

  // Get the most recently selected mood (or null if none)
  const getCurrentMood = () => {
    if (moodHistory.length === 0) {
      console.log('No mood history found, returning null');
      return null;
    }
    const currentMood = moodHistory[moodHistory.length - 1].mood;
    console.log('Current mood derived from history:', currentMood);
    return currentMood;
  };

  // Temporary content display for testing
  const renderContent = () => {
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
        const hasRecentMood = currentMood && moodHistory.length > 0 ? 
          isWithin10Minutes(moodHistory[moodHistory.length - 1].timestamp) : false;
          
        return <UserDashboard currentMood={currentMood} hasRecentMood={hasRecentMood} />;
      }
      
      const currentMood = getCurrentMood();
      
      // Check if user has recent mood (within 10 minutes)
      if (currentMood && moodHistory.length > 0) {
        const lastMoodTimestamp = moodHistory[moodHistory.length - 1].timestamp;
        
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
    <div className="min-h-screen flex flex-col">
      {/* Render appropriate navbar based on auth state */}
      {isAuthenticated ? (
        <AuthenticatedNavbar onNavigate={handleNavigate} currentPage={currentPage} />
      ) : (
        <PublicNavbar onNavigate={handleNavigate} currentPage={currentPage} />
      )}
      
      {/* Main content area */}
      <div className="flex-1 flex justify-center items-start pt-12">
        <div className="w-full max-w-4xl px-4">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default App;