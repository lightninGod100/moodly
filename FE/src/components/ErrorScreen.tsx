// src/components/ErrorScreen.tsx
import React from 'react';

interface ErrorScreenProps {
  title?: string;
  message?: string;
  emoji?: string;
  showMoodBox?: boolean;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({ 
  title = "We're Feeling Tired Right Now",
  message = "Our servers need a little rest.\nPlease try refreshing or come back later.",
  emoji = "😴",
  showMoodBox = true
}) => {
  return (
    <div className="text-center py-16">
      {/* Main Error Emoji with Animation */}
      <div className="text-8xl mb-6 animate-bounce">
        {emoji}
      </div>
      
      {/* Error Title */}
      <h1 className="text-4xl font-bold mb-4">{title}</h1>
      
      {/* Error Message */}
      <p className="text-xl text-gray-600 mb-8 whitespace-pre-line">
        {message}
      </p>
      
      {/* Moodly-Themed Mood Box (Optional) */}
      {showMoodBox && (
        <div className="border-2 border-gray-300 inline-block px-8 py-4 rounded-lg opacity-50">
          <span className="text-2xl">{emoji}</span>
          <div className="text-sm mt-2 text-gray-500">Server Mood: Tired</div>
        </div>
      )}
    </div>
  );
};

export default ErrorScreen;