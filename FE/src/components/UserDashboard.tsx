// src/components/UserDashboard.tsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { userStatsApiService } from '../services/UserStatsService';
import type { DominantMoodResponse, HappinessDataPoint, MoodFrequencyData } from '../services/UserStatsService';
// Define mood types and scoring system
type MoodType = 'Happy' | 'Sad' | 'Anxious' | 'Calm' | 'Excited' | 'Tired' | 'Angry';

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


const UserDashboard = ({ 
  currentMood, 
  hasRecentMood, 
  onNavigate 
}: UserDashboardProps): React.ReactElement => {
  const [selectedFrequencyPeriod, setSelectedFrequencyPeriod] = useState<TimePeriod>('today');

    // API data states
    const [dominantMoodData, setDominantMoodData] = useState<DominantMoodResponse | null>(null);
    const [happinessData, setHappinessData] = useState<HappinessDataPoint[]>([]);
    const [frequencyData, setFrequencyData] = useState<MoodFrequencyData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      fetchUserStats();
    }, []);
  
    // Fetch frequency data when period changes
    useEffect(() => {
      if (selectedFrequencyPeriod) {
        fetchFrequencyData(selectedFrequencyPeriod);
      }
    }, [selectedFrequencyPeriod]);

    const fetchUserStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const stats = await userStatsApiService.getAllUserStats();
        
        setDominantMoodData(stats.dominantMood);
        setHappinessData(stats.happinessIndex);
        setFrequencyData(stats.frequencyToday);
      } catch (err) {
        console.error('Failed to fetch user stats:', err);
        setError('Failed to load your mood statistics');
      } finally {
        setIsLoading(false);
      }
    };
  
    const fetchFrequencyData = async (period: TimePeriod) => {
      try {
        const data = await userStatsApiService.getMoodFrequency(period);
        setFrequencyData(data);
      } catch (err) {
        console.error('Failed to fetch frequency data:', err);
      }
    };
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
const DominantModeSection: React.FC = () => {
  if (!dominantMoodData) return null;
  
  return (
    <div className="border-2 border-black p-6 h-full">
      <h3 className="font-bold text-lg mb-4">Dominant Mode</h3>
      <div className="grid grid-cols-3 gap-3">
        {(['today', 'week', 'month'] as const).map((period) => {
          const data = dominantMoodData[period];
          if (!data || !data.mood) {
            return (
              <div key={period} className="border border-gray-300 p-3 text-center">
                <div className="text-xs font-medium uppercase mb-1 text-gray-600">
                  {period}
                </div>
                <div className="text-2xl mb-1">❓</div>
                <div className="text-xs text-gray-400">No data</div>
              </div>
            );
          }
          
          return (
            <div key={period} className="border border-gray-300 p-3 text-center">
              <div className="text-xs font-medium uppercase mb-1 text-gray-600">
                {period}
              </div>
              <div className="text-2xl mb-1">
                {MOOD_EMOJIS[data.mood as MoodType]}
              </div>
              <div className="text-xs font-medium">{data.mood}</div>
              <div className="text-xs text-gray-600">{data.percentage}% Time</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Personal Happiness Index Chart Component
const HappinessIndexChart: React.FC = () => {
  // Use data as-is (already in chronological order from API)
  const chartData = happinessData.map((point) => ({
    date: point.date,
    score: point.score || 0
  }));

  return (
    <div className="border-2 border-black p-6 h-full">
      <h3 className="font-bold text-lg mb-2">Personal Happiness Index</h3>
      <div className="text-xs text-gray-600 mb-4">Last 30 Days</div>
      
      <div style={{ width: '100%', height: '256px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#6b7280' }}
                interval={6} // Show every 7th date (0, 7, 14, 21, 28)
                tickFormatter={(value) => {
                  // Format date as MM/DD
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
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
                labelFormatter={(label) => {
                  // Show full date in tooltip
                  const date = new Date(label);
                  return date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  });
                }}
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
    if (!frequencyData) return null;
    
    // Convert data to format suitable for Recharts
    const chartData = Object.entries(frequencyData).map(([mood, count]) => ({
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
  
      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="text-2xl">Loading your mood statistics...</div>
        </div>
      )}
  
      {/* Error State */}
      {error && !isLoading && (
        <div className="text-center py-12">
          <div className="text-red-600 text-xl">{error}</div>
          <button 
            onClick={fetchUserStats}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      )}
  
      {/* Main Content */}
      {!isLoading && !error && (
        <>
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
        </>
      )}
    </div>
  );
};

export default UserDashboard;