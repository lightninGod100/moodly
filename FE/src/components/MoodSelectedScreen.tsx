// src/components/MoodSelectedScreen.tsx
import React from 'react';

// Define valid mood types
type MoodType = 'Happy' | 'Excited' | 'Calm' | 'Tired' | 'Anxious' | 'Angry' | 'Sad';

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
  return `You are Among ${percentage} Users who are feeling ${mood} Right now`;
};

interface MoodSelectedScreenProps {
  currentMood: string;
  moodEmoji: string;
}

const MoodSelectedScreen: React.FC<MoodSelectedScreenProps> = ({ currentMood, moodEmoji }) => {

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-8">Your Current Mood</h1>
      
      {/* Mood Emoji Display */}
      <div className="mb-8">
        <div className="inline-block border-2 border-black p-8 text-6xl">
          {moodEmoji}
        </div>
      </div>
      
      {/* Mood Dependent Message */}
      <div className="mb-8">
        <p className="text-xl">
          {getMoodDependentMessage(currentMood)}
        </p>
      </div>
      
      {/* Stats and Insights Section */}
      <div className="flex flex-col md:flex-row gap-6 justify-center max-w-4xl mx-auto">
        {/* Stats Based on Mood */}
        <div className="border-2 border-black p-6 flex-1">
          <h3 className="font-bold text-lg mb-4">Stats Based on Mood</h3>
          <p className="text-center">
            {getStatMessage(currentMood)}
          </p>
        </div>
        
        {/* Insight Message */}
        <div className="border-2 border-black p-6 flex-1">
          <h3 className="font-bold text-lg mb-4">Insight Message (1 Message)</h3>
          <p className="text-center">
            Your Mood Has Improved from Sad to {currentMood}
            <br />
            This is the 3rd time you are feeling {currentMood}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MoodSelectedScreen;