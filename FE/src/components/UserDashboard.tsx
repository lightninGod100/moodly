 // src/components/UserDashboard.tsx
import React, { useState } from 'react';

// Define valid time periods and mood types
type TimePeriod = 'live' | 'today' | 'week' | 'month';
type MoodType = 'Happy' | 'Sad' | 'Anxious' | 'Calm' | 'Excited' | 'Tired' | 'Angry';

// Static user mood frequency data for different time periods
const staticUserMoodData: Record<TimePeriod, Record<MoodType, number>> = {
  live: {
    Happy: 180,
    Sad: 90,
    Anxious: 120,
    Calm: 160,
    Excited: 100,
    Tired: 80,
    Angry: 50
  },
  today: {
    Happy: 5,
    Sad: 2,
    Anxious: 3,
    Calm: 4,
    Excited: 1,
    Tired: 2,
    Angry: 1
  },
  week: {
    Happy: 25,
    Sad: 12,
    Anxious: 18,
    Calm: 20,
    Excited: 8,
    Tired: 15,
    Angry: 7
  },
  month: {
    Happy: 95,
    Sad: 45,
    Anxious: 60,
    Calm: 80,
    Excited: 35,
    Tired: 50,
    Angry: 25
  }
};

// Time period display names
const timePeriodLabels: Record<TimePeriod, string> = {
  live: 'Live',
  today: 'Today',
  week: 'Last 7 Days',
  month: 'Last 30 days'
};

interface UserDashboardProps {
  currentMood: string | null;
  hasRecentMood: boolean; // If user selected mood within 10 minutes
}

const UserDashboard: React.FC<UserDashboardProps> = ({ currentMood, hasRecentMood }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('live');

  const currentData = staticUserMoodData[selectedPeriod];
  
  // Get maximum value for chart scaling
  const maxValue = Math.max(...Object.values(currentData));

  return (
    <div className="py-8">
      {/* Header with Current Mood Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        {/* Main Header */}
        <div className="flex-1 border-2 border-black p-6">
          <h1 className="text-2xl font-bold">
            Hi User ! Here is Your Personalised Mood Stats
          </h1>
        </div>
        
        {/* Current Mood Sidebar */}
        <div className="border-2 border-black p-4 lg:w-80">
          <h3 className="font-bold text-lg mb-2">Current Mood</h3>
          <div className="text-sm text-gray-600">
            {hasRecentMood && currentMood ? (
              <div>
                <div className="text-2xl mb-2">😊</div>
                <div>You're feeling <strong>{currentMood}</strong> right now</div>
              </div>
            ) : (
              <div>
                ? If the user hasn't selected mood for last 10 mins otherwise show the mood
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Time Filter Tabs */}
      <div className="mb-8 text-center">
        <div className="inline-flex border-2 border-black">
          {Object.entries(timePeriodLabels).map(([period, label]) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period as TimePeriod)}
              className={`px-6 py-3 text-lg font-medium border-r-2 border-black last:border-r-0 ${
                selectedPeriod === period
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="flex flex-col lg:flex-row gap-8 mb-8">
        {/* Bar Chart - Mood Frequency */}
        <div className="flex-1 border-2 border-black p-6">
          <h3 className="font-bold text-lg mb-4">Mood Frequency</h3>
          <div className="flex items-end justify-around h-64 bg-gray-50 p-4">
            {Object.entries(currentData).slice(0, 4).map(([mood, count]) => (
              <div key={mood} className="flex flex-col items-center">
                <div 
                  className="bg-blue-500 w-12 mb-2"
                  style={{ 
                    height: `${(count / maxValue) * 200}px`,
                    minHeight: '20px'
                  }}
                ></div>
                <div className="text-xs text-center transform -rotate-45 mt-2">
                  {mood}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {count}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Line Chart - Mood Trend */}
        <div className="flex-1 border-2 border-black p-6">
          <h3 className="font-bold text-lg mb-2">Mood Trend</h3>
          <div className="text-sm text-gray-600 mb-4">
            To be implemented later<br />
            But Average mood value will be calculated<br />
            like happy is 3 and so on so a score will be calculated
          </div>
          <div className="h-48 bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">📈</div>
              <div className="text-gray-600">Line Chart Placeholder</div>
              <div className="text-xs text-gray-500">
                (Will show mood trend over time)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Insights Section */}
      <div className="border-2 border-black p-8 text-center">
        <h3 className="font-bold text-2xl mb-4">Insights</h3>
        <p className="text-xl text-gray-600">To Be Implemented later</p>
      </div>
    </div>
  );
};

export default UserDashboard;
