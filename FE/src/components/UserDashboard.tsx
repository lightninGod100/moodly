// src/components/UserDashboard.tsx
import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { userStatsApiService } from '../services/UserStatsService';
import type { DominantMoodResponse, HappinessDataPoint, MoodFrequencyData } from '../services/UserStatsService';
import * as THREE from 'three';
import WAVES from 'vanta/dist/vanta.waves.min';
import { useUser } from '../contexts/UserContext';
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
  onNavigate?: (page: string) => void;
}

const UserDashboard = ({ 
  currentMood, 
  hasRecentMood, 
  onNavigate 
}: UserDashboardProps): React.ReactElement => {
  // Vanta refs
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);
  const { user } = useUser();
  const [selectedFrequencyPeriod, setSelectedFrequencyPeriod] = useState<TimePeriod>('today');

  // API data states
  const [dominantMoodData, setDominantMoodData] = useState<DominantMoodResponse | null>(null);
  const [happinessData, setHappinessData] = useState<HappinessDataPoint[]>([]);
  const [frequencyData, setFrequencyData] = useState<MoodFrequencyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Vanta effect
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (!vantaEffect.current && vantaRef.current) {
          console.log('Initializing Vanta Waves for UserDashboard...');
          
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
            color: 0xb0b10,
            shininess: 50,
            waveHeight: 20,
            waveSpeed: 1.2,
            zoom: 0.75
          });
          
          console.log('Vanta effect created for UserDashboard');
          
          // Force a resize after creation
          setTimeout(() => {
            if (vantaEffect.current && vantaEffect.current.resize) {
              vantaEffect.current.resize();
            }
          }, 500);
        }
      } catch (error) {
        console.error('Error initializing Vanta Waves:', error);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      try {
        if (vantaEffect.current) {
          console.log('Destroying Vanta effect...');
          vantaEffect.current.destroy();
          vantaEffect.current = null;
        }
      } catch (error) {
        console.error('Error destroying Vanta effect:', error);
      }
    };
  }, []);

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
    <div className="dashboard-box dashboard-current-mood">
      <h3 className="dashboard-box-title">Current Mood</h3>
      <div 
        className={`text-center ${!hasRecentMood ? 'cursor-pointer hover:bg-white hover:bg-opacity-10' : ''}`}
        onClick={handleCurrentMoodClick}
      >
        {hasRecentMood && currentMood ? (
          <>
            <div className="text-4xl mb-2">
              {MOOD_EMOJIS[currentMood as MoodType]}
            </div>
            <div className="font-medium text-lg text-white">{currentMood}</div>
          </>
        ) : (
          <>
            <div className="text-4xl mb-2">❓</div>
            <div className="text-gray-300 text-sm">
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
      <div className="dashboard-box dashboard-dominant-mood">
        <h3 className="dashboard-box-title">Dominant Mode</h3>
        <div className="grid grid-cols-3 gap-3">
          {(['today', 'week', 'month'] as const).map((period) => {
            const data = dominantMoodData[period];
            if (!data || !data.mood) {
              return (
                <div key={period} className="border border-gray-300 p-3 text-center bg-white bg-opacity-10 rounded">
                  <div className="text-xs font-medium uppercase mb-1 text-gray-300">
                    {period}
                  </div>
                  <div className="text-2xl mb-1">❓</div>
                  <div className="text-xs text-gray-400">No data</div>
                </div>
              );
            }
            
            return (
              <div key={period} className="border border-gray-300 p-3 text-center bg-white bg-opacity-10 rounded">
                <div className="text-xs font-medium uppercase mb-1 text-gray-300">
                  {period}
                </div>
                <div className="text-2xl mb-1">
                  {MOOD_EMOJIS[data.mood as MoodType]}
                </div>
                <div className="text-xs font-medium text-white">{data.mood}</div>
                <div className="text-xs text-gray-300">{data.percentage}% Time</div>
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
      <div className="dashboard-box dashboard-happiness-chart">
        <h3 className="dashboard-box-title">Personal Happiness Index</h3>
        <div className="text-xs text-gray-300 mb-4">Last 30 Days</div>
        
        <div style={{ width: '100%', height: '300px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#d1d5db' }}
                  interval={6}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis 
                  domain={[-1, 1]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#d1d5db' }}
                  tickFormatter={(value) => value.toFixed(1)}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#ffffff'
                  }}
                  formatter={(value: number) => [value.toFixed(2), 'Happiness Score']}
                  labelFormatter={(label) => {
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
                  stroke="#60a5fa" 
                  strokeWidth={2}
                  dot={{ fill: '#60a5fa', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };
  interface AIInsightsProps {
    // Future props can be added here when AI insights are implemented
    // userMoodData?: any;
    // insights?: string[];
    // isLoading?: boolean;
  }
  
  const AIInsights: React.FC<AIInsightsProps> = () => {
    return (
      <div className="dashboard-box dashboard-ai-insights">
        <h3 className="dashboard-box-title">AI Insights</h3>
        <p>Coming Soon</p>
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
      <div className="dashboard-box dashboard-frequency-counter">
        <div className="flex justify-between items-center mb-4">
          <h3 className="dashboard-box-title">Mood Frequency Counter</h3>
          
          {/* Time filter tabs */}
          <div className="flex border border-gray-300 rounded">
            {(['today', 'week', 'month'] as TimePeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedFrequencyPeriod(period)}
                className={`px-3 py-1 text-xs font-medium border-r border-gray-300 last:border-r-0 ${
                  selectedFrequencyPeriod === period
                    ? 'bg-white text-black'
                    : 'bg-black bg-opacity-40 text-white hover:bg-white hover:bg-opacity-20'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Bar chart */}
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                <XAxis 
                  dataKey="mood"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#d1d5db' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#d1d5db' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#ffffff'
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    `${value} times`,
                    `${props.payload.emoji} ${props.payload.mood}`
                  ]}
                  labelFormatter={() => ''}
                />
                <Bar 
                  dataKey="count" 
                  fill="#60a5fa" 
                  radius={[4, 4, 0, 0]}
                  stroke="#3b82f6"
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
    <div ref={vantaRef} className="vanta-waves-container min-h-screen">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
        <h1 className="dashboard-title">Hi {user?.username || 'User'}!</h1>
          <p className="dashboard-subtitle">Here are your Personalized Mood Stats</p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="dashboard-loading">
            <div className="dashboard-loading-text">Loading your mood statistics...</div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="dashboard-error">
            <div className="dashboard-error-text">{error}</div>
            <button 
              onClick={fetchUserStats}
              className="dashboard-retry-button"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Main Content */}
        {!isLoading && !error && (
          <>
            {/* Dashboard Grid Layout */}
            <div className="dashboard-grid">
              <CurrentMoodBox />
              <DominantModeSection />
              <HappinessIndexChart />
              <MoodFrequencyCounter />
              <AIInsights />
            </div>

          </>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;