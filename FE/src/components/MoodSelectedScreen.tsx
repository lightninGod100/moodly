// src/components/MoodSelectedScreen.tsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import WAVES from 'vanta/dist/vanta.waves.min';

// Define valid mood types
type MoodType = 'Happy' | 'Excited' | 'Calm' | 'Tired' | 'Anxious' | 'Angry' | 'Sad';

// Mood color mapping (hex to Vanta-compatible format)
export const moodColors: { [key: string]: string } = {
  Happy: '#22c55e',    // Green
  Excited: '#f59e0b',  // Amber  
  Calm: '#3b82f6',     // Blue
  Tired: '#8b5cf6',    // Purple
  Sad: '#6366f1',      // Indigo
  Angry: '#ef4444',    // Red
  Anxious: '#f97316',  // Orange
  default: '#4b5563'   // Gray for no data
};

// Convert hex to Vanta color format (remove # and convert to number)
const hexToVantaColor = (hex: string): number => {
  return parseInt(hex.replace('#', ''), 16);
};

// Helper functions outside component (better performance)
const getMoodDependentMessage = (mood: string): string => {
  const messages: Record<MoodType, string> = {
    'Happy': 'Glad To hear ! You are Feeling Happy Right Now',
    'Excited': 'Amazing ! You are Feeling Excited Right Now',
    'Calm': 'Wonderful ! You are Feeling Calm Right Now',
    'Tired': 'Take some rest ! You are Feeling Tired Right Now',
    'Anxious': 'Take deep breaths ! You are Feeling Anxious Right Now',
    'Angry': 'Take it easy ! You are Feeling Angry Right Now',
    'Sad': 'Hope you feel better ! You are Feeling Sad Right Now'
  };
  return messages[mood as MoodType] || `You are Feeling ${mood} Right Now`;
};

const getStatMessage = (mood: string): string => {
  const percentages: Record<MoodType, string> = {
    'Happy': '15%',
    'Excited': '8%',
    'Calm': '12%',
    'Tired': '20%',
    'Anxious': '18%',
    'Angry': '5%',
    'Sad': '10%'
  };
  const percentage = percentages[mood as MoodType] || '12%';
  return `You are among ${percentage} of users feeling ${mood} right now`;
};

// Add inspirational quotes for each mood
const getMoodQuote = (mood: string): string => {
  const quotes: Record<MoodType, string> = {
    'Happy': `"Happiness is not something ready-made. It comes from your own actions."`,
    'Excited': `"The way to get started is to quit talking and begin doing."`,
    'Calm': `"Peace comes from within. Do not seek it without."`,
    'Tired': `"Rest when you're weary. Refresh and renew yourself, your body, your mind, your spirit."`,
    'Anxious': `"You have been assigned this mountain to show others it can be moved."`,
    'Angry': `"The best fighter is never angry. Anger is like a storm rising up from the bottom of your consciousness."`,
    'Sad': `"The wound is the place where the Light enters you."`
  };
  return quotes[mood as MoodType] || `"Every mood is a step in your journey of self-discovery."`;
};

interface MoodSelectedScreenProps {
  currentMood: string;
  moodEmoji: string;
}

const MoodSelectedScreen: React.FC<MoodSelectedScreenProps> = ({ currentMood, moodEmoji }) => {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);

  // Get color for current mood
  const getMoodColor = (mood: string): number => {
    const colorHex = moodColors[mood] || moodColors.default;
    return hexToVantaColor(colorHex);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('=== VANTA DEBUGGING - MoodSelectedScreen ===');
      console.log('vantaRef.current:', vantaRef.current);
      console.log('Current mood:', currentMood);
      console.log('Mood color:', moodColors[currentMood] || moodColors.default);
      
      try {
        if (!vantaEffect.current && vantaRef.current) {
          console.log('Initializing Vanta Waves for MoodSelectedScreen...');
          
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
            color: getMoodColor(currentMood),
            shininess: 50,
            waveHeight: 20,
            waveSpeed: 1.2,
            zoom: 0.75
          });
          
          console.log('Vanta effect created for MoodSelectedScreen:', vantaEffect.current);
          
          // Force a resize after creation
          setTimeout(() => {
            if (vantaEffect.current && vantaEffect.current.resize) {
              console.log('Forcing Vanta resize...');
              vantaEffect.current.resize();
            }
          }, 500);
        }
      } catch (error) {
        console.error('Error initializing Vanta Waves in MoodSelectedScreen:', error);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []); // Empty dependency array for initial setup

  // Update Vanta color when mood changes
  useEffect(() => {
    if (vantaEffect.current && currentMood) {
      try {
        const newColor = getMoodColor(currentMood);
        console.log('Updating Vanta color for mood:', currentMood, 'to color:', newColor);
        
        // Update the color property of the existing effect
        if (vantaEffect.current.options) {
          vantaEffect.current.options.color = newColor;
        }
      } catch (error) {
        console.error('Error updating Vanta color:', error);
      }
    }
  }, [currentMood]); // Re-run when currentMood changes

  // Cleanup effect
  useEffect(() => {
    return () => {
      try {
        if (vantaEffect.current) {
          console.log('Destroying Vanta effect in MoodSelectedScreen...');
          vantaEffect.current.destroy();
          vantaEffect.current = null;
        }
      } catch (error) {
        console.error('Error destroying Vanta effect:', error);
      }
    };
  }, []);

  return (
    <div ref={vantaRef} className="vanta-waves-container">
      {/* Main Content - Centered and Contained */}
      <div className="flex flex-col items-center justify-center h-full max-w-6xl mx-auto px-4">
        
        {/* Title */}
        <h1 className="text-white text-4xl md:text-6xl font-bold mb-8 text-center">
          Your Current Mood
        </h1>
        
        {/* Enhanced Mood Display */}
        <div className="mb-8">
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-white bg-opacity-30 rounded-full blur-xl scale-125 animate-pulse"></div>
            
            {/* Main Mood Container */}
            <div className="relative border-3 border-white bg-white bg-opacity-25 backdrop-blur-lg p-8 md:p-12 rounded-2xl shadow-2xl">
              <div className="text-7xl md:text-8xl mb-3 text-center animate-bounce">
                {moodEmoji}
              </div>
              <div className="text-white text-xl md:text-2xl font-bold text-center tracking-wide">
                {currentMood}
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Mood Message */}
        <div className="mb-10">
          <p className="text-white text-xl md:text-2xl font-medium text-center leading-relaxed max-w-3xl">
            {getMoodDependentMessage(currentMood)}
          </p>
        </div>
        
        {/* Compact Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          
          {/* Enhanced Stats Card */}
          <div className="border-2 border-white bg-white bg-opacity-20 backdrop-blur-lg p-6 rounded-xl shadow-xl text-center">
            <div className="text-3xl mb-3">🌍</div>
            <h3 className="font-bold text-lg mb-3 text-white">Global Connection</h3>
            <p className="text-white text-base">
              {getStatMessage(currentMood)}
            </p>
          </div>
          
          {/* Enhanced Inspiration Card */}
          <div className="border-2 border-white bg-white bg-opacity-20 backdrop-blur-lg p-6 rounded-xl shadow-xl text-center">
            <div className="text-3xl mb-3">✨</div>
            <h3 className="font-bold text-lg mb-3 text-white">Mood Captured</h3>
            <p className="text-white text-base">
              Thank you for sharing your feelings. Keep tracking your journey!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodSelectedScreen;