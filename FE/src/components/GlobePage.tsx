import React, { useState } from 'react';

// Define valid time periods and mood types
type TimePeriod = 'live' | 'today' | 'week' | 'month';
type MoodType = 'Happy' | 'Excited' | 'Calm' | 'Tired' | 'Sad' | 'Angry' | 'Anxious';

// Static mood data for different time periods
const staticGlobalMoodData: Record<TimePeriod, Record<MoodType, number>> = {
  live: {
    Happy: 15,
    Excited: 19,
    Calm: 15,
    Tired: 15,
    Sad: 15,
    Angry: 15,
    Anxious: 15
  },
  today: {
    Happy: 18,
    Excited: 14,
    Calm: 20,
    Tired: 12,
    Sad: 13,
    Angry: 8,
    Anxious: 15
  },
  week: {
    Happy: 22,
    Excited: 16,
    Calm: 18,
    Tired: 14,
    Sad: 10,
    Angry: 6,
    Anxious: 14
  },
  month: {
    Happy: 25,
    Excited: 15,
    Calm: 17,
    Tired: 13,
    Sad: 12,
    Angry: 7,
    Anxious: 11
  }
};

// Mood emoji mapping
const moodEmojis: Record<MoodType, string> = {
  Happy: '😊',
  Excited: '😃',
  Calm: '😌',
  Tired: '😴',
  Sad: '😢',
  Angry: '😠',
  Anxious: '😰'
};

// Time period display names
const timePeriodLabels: Record<TimePeriod, string> = {
  live: 'Live',
  today: 'Today',
  week: 'Last 7 Days',
  month: 'Last 30 days'
};

const GlobePage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('live');

  const currentData = staticGlobalMoodData[selectedPeriod];

  return (
    <div className="text-center py-8">
      {/* Header - will be shown by navbar, keeping for context */}
      <h1 className="text-3xl font-bold mb-8">Global Mood Statistics</h1>
      
      {/* Time Filter Tabs */}
      <div className="mb-8">
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

      {/* Global Mood Statistics Grid */}
      <div className="mb-12">
        <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto">
          {Object.entries(currentData).map(([mood, percentage]) => (
            <div
              key={mood}
              className="border-2 border-black p-6 flex flex-col items-center min-w-[150px]"
            >
              {/* Mood Emoji */}
              <div className="text-4xl mb-2">
                {moodEmojis[mood as MoodType]}
              </div>
              
              {/* Mood Name */}
              <div className="font-bold text-lg mb-2">
                {mood}
              </div>
              
              {/* Percentage */}
              <div className="text-gray-700">
                {percentage}% Users
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Placeholder for World Map */}
      <div className="bg-gray-200 h-96 flex items-center justify-center rounded-lg mx-auto max-w-4xl">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">🌍</div>
          <div className="text-lg text-gray-600">Interactive World Map</div>
          <div className="text-sm text-gray-500">
            (Will be implemented with static image + overlays)
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobePage;
