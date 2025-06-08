// src/components/UserDashboard.tsx
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Define mood types and scoring system
type MoodType = 'Happy' | 'Sad' | 'Anxious' | 'Calm' | 'Excited' | 'Tired' | 'Angry';

// Mood to happiness score mapping
const MOOD_SCORES: Record<MoodType, number> = {
  Happy: 1,
  Excited: 0.67,
  Calm: 0.33,
  Tired: -0.1,
  Anxious: -0.4,
  Angry: -0.7,
  Sad: -1
};
// Mood emoji mapping
const MOOD_EMOJIS: Record<MoodType, string> = {
  Happy: '😊',
  Excited: '😃',
  Calm: '😌',
  Tired: '😴',
  Anxious: '😰',
  Angry: '😠',
  Sad: '😢'
};

// Time period type for frequency counter
type TimePeriod = 'today' | 'week' | 'month';

interface UserDashboardProps {
  currentMood: string | null;
  hasRecentMood: boolean;
  onNavigate?: (page: string) => void; // Add navigation prop
}

// Static mock data for development
const MOCK_DOMINANT_MODE_DATA = {
  today: { mood: 'Happy' as MoodType, percentage: 45 },
  week: { mood: 'Calm' as MoodType, percentage: 32 },
  month: { mood: 'Happy' as MoodType, percentage: 28 }
};

// Mock 30-day happiness data (last 30 days) - formatted for Recharts
const MOCK_HAPPINESS_DATA = [
  { day: 1, score: 0.2 }, { day: 2, score: 0.8 }, { day: 3, score: -0.1 },
  { day: 4, score: 0.6 }, { day: 5, score: 0 }, { day: 6, score: 0.9 },
  { day: 7, score: 0.3 }, { day: 8, score: -0.2 }, { day: 9, score: 0.7 },
  { day: 10, score: 0.1 }, { day: 11, score: 0 }, { day: 12, score: 0.5 },
  { day: 13, score: 0.8 }, { day: 14, score: -0.3 }, { day: 15, score: 0.4 },
  { day: 16, score: 0.9 }, { day: 17, score: 0.2 }, { day: 18, score: 0 },
  { day: 19, score: 0.6 }, { day: 20, score: -0.1 }, { day: 21, score: 0.7 },
  { day: 22, score: 0.3 }, { day: 23, score: 0 }, { day: 24, score: 0.8 },
  { day: 25, score: 0.1 }, { day: 26, score: 0.5 }, { day: 27, score: 0.9 },
  { day: 28, score: 0.4 }, { day: 29, score: 0.2 }, { day: 30, score: 0.6 }
];

// Mock frequency data
const MOCK_FREQUENCY_DATA: Record<TimePeriod, Record<MoodType, number>> = {
  today: {
    Happy: 8, Excited: 3, Calm: 5, Tired: 2, Anxious: 1, Angry: 0, Sad: 1
  },
  week: {
    Happy: 25, Excited: 15, Calm: 20, Tired: 12, Anxious: 8, Angry: 3, Sad: 7
  },
  month: {
    Happy: 95, Excited: 45, Calm: 80, Tired: 50, Anxious: 30, Angry: 15, Sad: 25
  }
};

const UserDashboard: React.FC<UserDashboardProps> = ({ 
  currentMood, 
  hasRecentMood, 
  onNavigate 
}) => {
  const [selectedFrequencyPeriod, setSelectedFrequencyPeriod] = useState<TimePeriod>('today');

  // Handle current mood navigation
  const handleCurrentMoodClick = () => {
    if (onNavigate && !hasRecentMood) {
      onNavigate('home');
    }
  };

  // Current Mood Box Component
  const CurrentMoodBox: React.FC = () => (
    <div className="border-2 border-black p-6 h-full">
      <h3 className="font-bold text-lg mb-4">Current Mood</h3>
      <div 
        className={`text-center ${!hasRecentMood ? 'cursor-pointer hover:bg-gray-50' : ''}`}
        onClick={handleCurrentMoodClick}
      >
        {hasRecentMood && currentMood ? (
          <>
            <div className="text-4xl mb-2">
              {MOOD_EMOJIS[currentMood as MoodType]}
            </div>
            <div className="font-medium text-lg">{currentMood}</div>
          </>
        ) : (
          <>
            <div className="text-4xl mb-2">❓</div>
            <div className="text-gray-600 text-sm">
              Click to select mood
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Dominant Mode Section Component
  const DominantModeSection: React.FC = () => (
    <div className="border-2 border-black p-6 h-full">
      <h3 className="font-bold text-lg mb-4">Dominant Mode</h3>
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(MOCK_DOMINANT_MODE_DATA).map(([period, data]) => (
          <div key={period} className="border border-gray-300 p-3 text-center">
            <div className="text-xs font-medium uppercase mb-1 text-gray-600">
              {period}
            </div>
            <div className="text-2xl mb-1">
              {MOOD_EMOJIS[data.mood]}
            </div>
            <div className="text-xs font-medium">{data.mood}</div>
            <div className="text-xs text-gray-600">{data.percentage}% Time</div>
          </div>
        ))}
      </div>
    </div>
  );

  // Personal Happiness Index Chart Component
  const HappinessIndexChart: React.FC = () => {
    // Debug logs
  console.log('Happiness Chart Data:', MOCK_HAPPINESS_DATA);
  console.log('Happiness Chart Data Length:', MOCK_HAPPINESS_DATA.length);
    return (
      <div className="border-2 border-black p-6 h-full">
        <h3 className="font-bold text-lg mb-2">Personal Happiness Index</h3>
        <div className="text-xs text-gray-600 mb-4">Last 30 Days</div>
        
        <div style={{ width: '100%', height: '256px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MOCK_HAPPINESS_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={[-1, 1]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickFormatter={(value) => value.toFixed(1)}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [value.toFixed(2), 'Happiness Score']}
                  labelFormatter={(label) => `Day ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#1d4ed8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  // Mood Frequency Counter Component
  const MoodFrequencyCounter: React.FC = () => {
    const currentData = MOCK_FREQUENCY_DATA[selectedFrequencyPeriod];
    
    // Convert data to format suitable for Recharts
    const chartData = Object.entries(currentData).map(([mood, count]) => ({
      mood,
      count,
      emoji: MOOD_EMOJIS[mood as MoodType]
    }));

    return (
      <div className="border-2 border-black p-6 h-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Mood Frequency Counter</h3>
          
          {/* Time filter tabs */}
          <div className="flex border border-gray-300">
            {(['today', 'week', 'month'] as TimePeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedFrequencyPeriod(period)}
                className={`px-3 py-1 text-xs font-medium border-r border-gray-300 last:border-r-0 ${
                  selectedFrequencyPeriod === period
                    ? 'bg-black text-white'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Bar chart */}
        <div style={{ width: '100%', height: '256px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="mood"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    `${value} times`,
                    `${props.payload.emoji} ${props.payload.mood}`
                  ]}
                  labelFormatter={() => ''}
                />
                <Bar 
                  dataKey="count" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                  stroke="#1e40af"
                  strokeWidth={1}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Hi User!</h1>
        <p className="text-lg text-gray-600">Here are your Personalized Mood Stats</p>
      </div>

      {/* 2x2 Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto mb-8">
        {/* Top Row */}
        <CurrentMoodBox />
        <DominantModeSection />
        
        {/* Bottom Row */}
        <HappinessIndexChart />
        <MoodFrequencyCounter />
      </div>

      {/* AI Insights Section */}
      <div className="border-2 border-black p-8 text-center max-w-6xl mx-auto">
        <h3 className="font-bold text-2xl mb-4">AI Insights</h3>
        <p className="text-xl text-gray-600">Coming Soon</p>
      </div>
    </div>
  );
};

export default UserDashboard;