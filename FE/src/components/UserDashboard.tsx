// src/components/UserDashboard.tsx
import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { userStatsApiService } from '../services/UserStatsService';
import type { DominantMoodResponse, HappinessDataPoint, MoodFrequencyData, ThroughDayViewData, MoodHistoryResponse } from '../services/UserStatsService';
import * as THREE from 'three';
import WAVES from 'vanta/dist/vanta.waves.min';
import { useUser } from '../contexts/UserContext';
// Import at top
import { aiInsightsApiService, hasValidCurrentInsights, isInsightGenerationInProgress } from '../services/AIInsightsService';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { useNotification } from '../contexts/NotificationContext';
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
}

const UserDashboard = ({
  currentMood,
  hasRecentMood
}: UserDashboardProps): React.ReactElement => {
  // Vanta refs
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);
  const { user } = useUser();
  const [selectedFrequencyPeriod, setSelectedFrequencyPeriod] = useState<TimePeriod>('month');
  const [throughDayViewPeriod, setThroughDayViewPeriod] = useState<'week' | 'month'>('month');
  // API data states
  const [dominantMoodData, setDominantMoodData] = useState<DominantMoodResponse | null>(null);
  const [happinessData, setHappinessData] = useState<HappinessDataPoint[] | null>(null);
  const [frequencyData, setFrequencyData] = useState<MoodFrequencyData | null>(null);
  const [throughDayViewData, setThroughDayViewData] = useState<ThroughDayViewData | null>(null);
  const [moodHistoryData, setMoodHistoryData] = useState<MoodHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Add state
  const [insightsData, setInsightsData] = useState<any>(null);
  const [isReportGenerating, setIsReportGenerating] = useState(false);

  const prevFrequencyPeriod = useRef<TimePeriod | null>(null);
  const prevThroughDayPeriod = useRef<'week' | 'month' | null>(null);
  // Update state to track report type
  const [reportType, setReportType] = useState<'current' | 'previous' | null>(null);
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  // In the component, after state declarations, add effect to check generation status
  useEffect(() => {
    // Check if generation is in progress on mount
    if (isInsightGenerationInProgress()) {
      setIsReportGenerating(true);

      // Poll for completion
      const pollInterval = setInterval(() => {
        if (!isInsightGenerationInProgress()) {
          setIsReportGenerating(false);
          clearInterval(pollInterval);
          // Check if insights are now available

          if (hasValidCurrentInsights()) {
            setIsReportGenerating(false);
            clearInterval(pollInterval);
          }
        }
      }, 2000); // Poll every 2 seconds

      return () => clearInterval(pollInterval);
    }
  }, []);

  // Update handleGenerateInsights to handle in-progress state
  const handleGenerateInsights = async () => {
    try {
      // If we already have valid cached insights, just load them
      if (hasValidCurrentInsights()) {
        setIsReportGenerating(true);
        const response = await aiInsightsApiService.generateInsights(); // This will return cached data
        setInsightsData(response.data);
        setReportType('current');
        console.log('Loaded cached insights:', response.data);
        setIsReportGenerating(false);
        return;
      }

      // Only check generation status for new generation
      if (isInsightGenerationInProgress()) {
        console.log('Generation already in progress');
        return;
      }

      setIsReportGenerating(true);
      const response = await aiInsightsApiService.generateInsights();
      setInsightsData(response.data);
      console.log('Current insights data structure:', response.data);
      setReportType('current');
      console.log('Insights generated:', response.data);
    } catch (error) {
      console.error('Failed to generate insights:', error);
      // Only show alert if it's not the "already in progress" error
      if (!(error as Error).message?.includes('already in progress')) {
        showNotification({
          type: 'error',
          message: 'Failed to generate insights'
        });
      }
    } finally {
      setIsReportGenerating(false);
    }
  };
  // Update handleViewPreviousInsights
  const handleViewPreviousInsights = async () => {
    try {
      setIsReportGenerating(true);
      const response = await aiInsightsApiService.getPreviousInsights();
      setInsightsData(response.data);  // This will be null if no previous report
      setReportType('previous');
      console.log('Previous insights response:', response);
    } catch (error) {
      console.error('Failed to load previous insights:', error);
      showNotification({
        type: 'error',
        message: 'Failed to load previous insights'
      }); // Only for actual errors
    } finally {
      setIsReportGenerating(false);
    }
  };

  // Add handler to clear insights and return to landing
  const handleBackToLanding = () => {
    setInsightsData(null);
    setReportType(null);
  };
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
    if (prevFrequencyPeriod.current !== null && 
        prevFrequencyPeriod.current !== selectedFrequencyPeriod) {
      fetchFrequencyData(selectedFrequencyPeriod);
    }
    prevFrequencyPeriod.current = selectedFrequencyPeriod;
  }, [selectedFrequencyPeriod]);

useEffect(() => {
  if (prevThroughDayPeriod.current !== null && 
      prevThroughDayPeriod.current !== throughDayViewPeriod) {
    fetchThroughDayViewData(throughDayViewPeriod);
  }
  prevThroughDayPeriod.current = throughDayViewPeriod;
}, [throughDayViewPeriod]);


  const fetchUserStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const stats = await userStatsApiService.getAllUserStats();

      // Set data for successful calls, keep existing data for failed calls
      if (stats.dominantMood) {
        setDominantMoodData(stats.dominantMood);
      }

      if (stats.happinessIndex && stats.happinessIndex.length > 0) {
        setHappinessData(stats.happinessIndex);
      }

      if (stats.frequencyToday) {
        setFrequencyData(stats.frequencyToday);
      }

      if (stats.throughDayView) {
        setThroughDayViewData(stats.throughDayView);
      }
      if (stats.moodHistory) {
        setMoodHistoryData(stats.moodHistory);
      }
      // Optional: Show a warning if some APIs failed but don't block the UI
      // You could add a toast notification here if needed

    } catch (err) {
      // This should rarely happen now since individual failures are handled
      console.error('Complete failure fetching user stats:', err);
      setError('Unable to load dashboard data');
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
      showNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Something seems wrong, please refresh or come back later'
      });
    }
  };

  const fetchThroughDayViewData = async (period: 'week' | 'month') => {
    try {
      const data = await userStatsApiService.getThroughDayView(period);
      setThroughDayViewData(data);
    } catch (err) {
      console.error('Failed to fetch through day view data');
      showNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Something seems wrong, please refresh or come back later'
      });
    }
  };
  // Handle current mood navigation
  const handleCurrentMoodClick = () => {
    if (!hasRecentMood) {
      navigate(ROUTES.MOOD);
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
    if (!dominantMoodData) return (
      <div className="dashboard-box dashboard-dominant-mood">
        <h3 className="dashboard-box-title">Dominant Mode</h3>
        <div className="flex-1 grid place-items-center">
          <p className="text-center text-gray-300 text-sm">
            Something went wrong. Reload the page or come back later.
          </p>
        </div>
      </div>
    )

    return (
      <div className="dashboard-box dashboard-dominant-mood">
        <h3 className="dashboard-box-title">🦾 Dominant Mode</h3>
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
    if (!happinessData) {
      return (
        <div className="dashboard-box dashboard-happiness-chart flex flex-col">
          <h3 className="dashboard-box-title">📈 Personal Happiness Index</h3>
          <div className="flex-1 grid place-items-center">
            <p className="text-center text-gray-300 text-sm">
              Something went wrong. Reload the page or come back later.
            </p>
          </div>
        </div>
      );
    }

    // New user / no data case
    if (happinessData.length === 0) {
      return (
        <div className="dashboard-box dashboard-happiness-chart flex flex-col">
          <h3 className="dashboard-box-title">📈 Personal Happiness Index</h3>
          <div className="flex-1 grid place-items-center">
            <p className="text-center text-gray-300 text-sm">
              No happiness data yet. Start tracking your moods to see trends!
            </p>
          </div>
        </div>
      );
    }
    // Use data as-is (already in chronological order from API)
    const chartData = happinessData.map((point) => ({
      date: point.date,
      score: point.score || 0
    }));
    // Custom dot renderer for color coding based on score
    const renderColoredDot = (props: any) => {
      const { cx, cy, payload } = props;

      // Three-way color coding
      let fillColor = '#ffffff'; // white for zero (default)
      if (payload.score > 0) {
        fillColor = '#6ee7b7'; // green for positive
      } else if (payload.score < 0) {
        fillColor = '#ef4444'; // red for negative
      }

      return (
        <circle
          cx={cx}
          cy={cy}
          r={4}
          fill={fillColor}
          stroke={fillColor}
          strokeWidth={2}
        />
      );
    };
    return (
      <div className="dashboard-box dashboard-happiness-chart">
        <h3 className="dashboard-box-title margin-top-2">😄 Personal Happiness Index
          <div style={{ position: 'relative', display: 'inline-block', marginLeft: '0.5rem' }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ cursor: 'help', opacity: 0.7 }}
              onMouseEnter={(e) => {
                const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                if (tooltip) tooltip.style.display = 'block';
              }}
              onMouseLeave={(e) => {
                const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                if (tooltip) tooltip.style.display = 'none';
              }}
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                color: 'rgb(230, 230, 230)',
                padding: '0.75rem 0.75rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                zIndex: 1000,
                display: 'none',
                marginBottom: '0.25rem',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                textAlign: 'center'
              }}
            >
              Personal Happiness Index combines your moods throughout the day into a single, <br />weighted average, giving a normalized value from -1 (negative) to 1 (positive).
            </div>
          </div>
        </h3>

        <div className="text-xs text-gray-300 mb-4">Index Score</div>

        <div style={{ width: '100%', height: '300px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                <XAxis
                  dataKey="date"
                  axisLine={{ stroke: '#9ca3af', strokeWidth: 2 }}
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
                  axisLine={{ stroke: '#9ca3af', strokeWidth: 2 }}
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
                  dot={renderColoredDot}
                  activeDot={{ r: 6, fill: '#3b82f6' }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="text-xs text-gray-300 mb-4 text-center">Last 30 Days</div>
      </div>
    );
  };
  interface ThroughDayViewProps {
    // No props needed since data comes from parent state
  }

  const ThroughDayView: React.FC<ThroughDayViewProps> = () => {
    if (!throughDayViewData) {
      return (
        <div className="dashboard-box dashboard-through-day-view flex flex-col">
          <h3 className="dashboard-box-title">☀️ Through the Day View 🌙</h3>

          <div className="flex-1 grid place-items-center">
            <p className="text-center text-gray-300 text-sm">
              Something went wrong. Reload the page or come back later.
            </p>
          </div>
        </div>

      );
    }

    // Define time periods and moods for consistent ordering
    const timePeriods = ['morning', 'afternoon', 'evening', 'night'] as const;
    const moods = ['Excited', 'Happy', 'Calm', 'Tired', 'Anxious', 'Angry', 'Sad'] as const;

    // Function to find max value in each time period
    const getMaxMoodForPeriod = (periodData: MoodFrequencyData): string => {
      let maxMood = 'Excited';
      let maxValue = periodData.Excited;

      moods.forEach(mood => {
        if (periodData[mood] > maxValue) {
          maxValue = periodData[mood];
          maxMood = mood;
        }
      });

      return maxMood;
    };

    return (
      <div className="dashboard-box dashboard-through-day-view">
        <div className="relative mb-4">
          <h3 className="dashboard-box-title text-center">Through the Day View</h3>

          {/* Time filter tabs - positioned absolutely on the right */}
          <div className="absolute right-0 top-0 flex border border-gray-300 rounded">
            {(['week', 'month'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setThroughDayViewPeriod(period)}
                className={`px-3 py-1 text-xs font-medium border-r border-gray-300 last:border-r-0 ${throughDayViewPeriod === period
                  ? 'bg-white text-black'
                  : 'bg-black bg-opacity-40 text-white hover:bg-white hover:bg-opacity-20'
                  }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left py-2 px-2 text-gray-300 font-medium">Time</th>
                {moods.map(mood => (
                  <th key={mood} className="text-center py-2 px-2 text-gray-300 font-medium text-xs">
                    <div>{MOOD_EMOJIS[mood]}</div>
                    <div>{mood}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timePeriods.map(period => {
                const periodData = throughDayViewData[period];
                const maxMood = getMaxMoodForPeriod(periodData);

                return (
                  <tr key={period} className="border-b border-gray-700">
                    <td className="py-3 px-2 text-white font-medium capitalize">
                      {period}
                    </td>
                    {moods.map(mood => {
                      const value = periodData[mood];
                      const isMax = mood === maxMood && value > 0;

                      return (
                        <td
                          key={mood}
                          className={`text-center py-3 px-2 text-xs ${isMax
                            ? 'bg-blue-500 bg-opacity-30 text-white font-bold border border-blue-400'
                            : 'text-gray-300'
                            }`}
                        >
                          {value.toFixed(1)}%
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  // Mood Frequency Counter Component
  const MoodFrequencyCounter: React.FC = () => {
    if (!frequencyData) {
      return (
        <div className="dashboard-box dashboard-frequency-counter flex flex-col">
          <h3 className="dashboard-box-title">⏱ Mood Frequency Counter</h3>

          <div className="flex-1 grid place-items-center">
            <p className="text-center text-gray-300 text-sm">
              Something went wrong. <br />Reload the page or come back later.
            </p>
          </div>
        </div>
      );
    }

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
                className={`px-3 py-1 text-xs font-medium border-r border-gray-300 last:border-r-0 ${selectedFrequencyPeriod === period
                  ? 'bg-white text-black'
                  : 'bg-black bg-opacity-40 text-white hover:bg-white hover:bg-opacity-20'
                  }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="text-xs text-gray-300 mb-2">Mood Count</div>
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
                  formatter={(value: number, props: any) => {
                    // Defensive check for props.payload
                    if (!props || !props.payload) {
                      return [`${value} times`, 'Mood'];
                    }
                    return [
                      `${value} times`,
                      `${props.payload.emoji || ''} ${props.payload.mood || ''}`
                    ];
                  }}
                  labelFormatter={() => ''}
                />
                <Bar
                  dataKey="count"
                  fill="#60a5fa"
                  radius={[4, 4, 0, 0]}
                  stroke="#3b82f6"
                  strokeWidth={1}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };
  interface MoodHistoryProps {
    // No props needed since data comes from parent state
  }

  const MoodHistory: React.FC<MoodHistoryProps> = () => {
    if (!moodHistoryData) {
      return (
        <div className="dashboard-box dashboard-mood-history flex flex-col">
          <h3 className="dashboard-box-title">📚 Mood History</h3>

          <div className="flex-1 grid place-items-center">
            <p className="text-center text-gray-300 text-sm">
              Something went wrong. <br />Reload the page or come back later.
            </p>
          </div>
        </div>
      );
    }

    // API success but no data case
    if (!moodHistoryData.moods || moodHistoryData.moods.length === 0) {
      return (
        <div className="dashboard-box dashboard-mood-history">
          <h3 className="dashboard-box-title">
            Mood History
          </h3>
          <p className="text-gray-300 text-sm">No mood history available.</p>
          <p className="text-gray-300 text-sm">Start logging your mood to see your history.</p>
        </div>
      );
    }


    // Format timestamp from UNIX to readable format
    const formatTimestamp = (unixTimestamp: number): string => {
      const date = new Date(unixTimestamp);
      const day = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${day} ${month} ${hours}:${minutes}`;
    };

    // Get mood with emoji
    const getMoodWithEmoji = (mood: string): string => {
      return `${mood} ${MOOD_EMOJIS[mood as keyof typeof MOOD_EMOJIS] || ''}`;
    };

    return (
      <div className="dashboard-box dashboard-mood-history">
        <h3 className="dashboard-box-title">
          Mood History

        </h3>

        <div className="overflow-y-auto max-h-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-600 sticky top-0 bg-[#04040a]">
                <th className="text-left py-2 px-2 text-gray-300 font-medium w-12">S.no</th>
                <th className="text-left py-2 px-2 text-gray-300 font-medium">Mood</th>
                <th className="text-right py-2 px-2 text-gray-300 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {moodHistoryData.moods.map((entry, index) => (
                <tr key={index} className="border-b border-gray-700">
                  <td className="py-2 px-2 text-white font-medium">
                    {index + 1}
                  </td>
                  <td className="py-2 px-2 text-white">
                    {getMoodWithEmoji(entry.mood)}
                  </td>
                  <td className="py-2 px-2 text-gray-300 text-right">
                    {formatTimestamp(entry.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-gray-400 text-xs mt-2 text-center">
          Showing {moodHistoryData.count} recent mood{moodHistoryData.count !== 1 ? 's' : ''}
        </p>
      </div>
    );
  };

  // AI Insights Landing Component
  // AI Insights Landing Component
  const AIInsightsLanding: React.FC = () => {

    // Update button disabled state in AIInsightsLanding
    const getButtonDisabledState = () => {
      if (hasValidCurrentInsights()) {
        return false;
      }
      return isReportGenerating || isInsightGenerationInProgress();
    };
    // In AIInsightsLanding component, update getStatusMessage
    const getStatusMessage = () => {
      // Don't show progress message if we have valid insights
      if (hasValidCurrentInsights()) {
        return null;
      }

      // Only show if actually generating
      if (isInsightGenerationInProgress()) {
        return (
          <div className="text-center mt-2">
            <p className="text-yellow-400 text-sm animate-pulse">
              ⏳ Insights generation in progress... This may take up to a minute.
            </p>
          </div>
        );
      }
      return null;
    };
    const getButtonText = () => {
      if (isReportGenerating) return 'Generating...';
      if (hasValidCurrentInsights()) return 'View Current Insights';
      return 'Generate Insights';
    };
    const getButtonTitleText = () => {
      if (isReportGenerating) return getStatusMessage();
      if (hasValidCurrentInsights()) return 'Click the button below to view your current insights';
      return 'click the button below to generate insights';
    };

    return (
      <div className="dashboard-box dashboard-ai-insights">
        <h3 className="dashboard-box-title text-center mt-3 !mb-6">
          🤖 AI-Powered Insights
        </h3>

        {/* 2x2 Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {/* How it works section */}
          <div className="border border-gray-300 p-4 bg-white bg-opacity-10 rounded">
            <h4 className="text-white font-medium mb-2 flex items-center">
              <span className="text-blue-400 mr-2">⚡</span>
              How It Works
            </h4>
            <p className="text-gray-300 text-sm leading-relaxed">
              An advanced AI model analyzes your mood patterns over time to identify trends,
              correlations, and behavioral insights. The system generates personalized recommendations
              to help you better understand and improve your emotional well-being.
            </p>
          </div>

          {/* Data Privacy section */}
          <div className="border border-gray-300 p-4 bg-white bg-opacity-10 rounded">
            <h4 className="text-white font-medium mb-2 flex items-center">
              <span className="text-green-400 mr-2">🔒</span>
              Data Privacy
            </h4>
            <p className="text-gray-300 text-sm leading-relaxed">
              Your privacy is our priority. We only share anonymized mood data with timestamps
              for analysis. No personal information, user identifiers, or sensitive data is ever
              transmitted to third-party services.
            </p>
          </div>

          {/* Data Requirements section */}
          <div className="border border-gray-300 p-4 bg-white bg-opacity-10 rounded">
            <h4 className="text-white font-medium mb-2 flex items-center">
              <span className="text-yellow-400 mr-2">📈</span>
              Data Requirements
            </h4>
            <div className="text-gray-300 text-sm space-y-2">
              <p className="leading-relaxed mb-2">
                Insight quality depends on available mood data:
              </p>
              <div className="space-y-1">
                <div className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span><strong className="text-white">Weekly Insights:</strong> Minimum 5 mood entries per week</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span><strong className="text-white">Monthly Insights:</strong> Minimum 20 mood entries per month</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>More frequent logging provides deeper, more accurate insights</span>
                </div>
              </div>
            </div>
          </div>

          {/* How to Generate section */}
          <div className="border border-gray-300 p-4 bg-white bg-opacity-10 rounded">
            <h4 className="text-white font-medium mb-2 flex items-center">
              <span className="text-purple-400 mr-2">📊</span>
              How to Generate
            </h4>
            <ul className="text-gray-300 text-sm space-y-1">
              <li className="flex items-start">
                <span className="text-gray-400 mr-2">•</span>
                <span>Click "Generate Insights" to start analysis</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-400 mr-2">•</span>
                <span>Processing takes up to 60 seconds</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-400 mr-2">•</span>
                <span>Generation continues in background</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-400 mr-2">•</span>
                <span>One report per 48-hour period</span>
              </li>

            </ul>
          </div>
        </div>
        {/* Info note */}
        <div className="text-center mt-4 py-2">
          <p className="text-gray-400 text-xs">
            {getButtonTitleText()}
          </p>
        </div>
        {/* Generate Button */}
        <div className="flex justify-center">
          <button
            onClick={handleGenerateInsights}
            disabled={getButtonDisabledState()}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg 
             transition-all duration-200 hover:scale-105 flex items-center space-x-2
             border border-blue-400 shadow-lg shadow-blue-500/20
             disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-lg">✨</span>
            <span>{getButtonText()}</span>
            <span className="text-lg">✨</span>
          </button>

        </div>
        {/* Previous Reports Section */}
        <div className="text-center mt-8 py-2">
          <p className="text-gray-400 text-xs">
            Click the button below to view your previous insight report
          </p>
        </div>

        {/* Previous Reports Button */}
        <div className="flex justify-center">
          <button
            onClick={handleViewPreviousInsights}
            disabled={isReportGenerating}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg 
     transition-all duration-200 hover:scale-105 flex items-center space-x-2
     border border-blue-400 shadow-lg shadow-blue-500/20
     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-lg">📄</span>
            <span>{isReportGenerating ? 'Loading...' : 'Previous Insights Report'}</span>
            <span className="text-lg">📄</span>
          </button>
        </div>

      </div>
    );
  };
  const formatGeneratedDate = (timestamp: number | string): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const AIInsightsDisplay: React.FC = () => {

    // Check if data is null (no previous report case)
    if (reportType === 'previous' && insightsData === null) {
      return (
        <div className="dashboard-box dashboard-ai-insights-results">
          <h3 className="dashboard-box-title text-center mb-4">
            Previous AI Insights Report
          </h3>

          <div className="text-center py-8">
            <div className="text-4xl mb-4">📊</div>
            <h4 className="text-white font-medium mb-2">No Previous Report Found</h4>
            <p className="text-gray-400 text-sm mb-4">
              You haven't generated any previous insights reports yet.
            </p>
            <p className="text-gray-400 text-xs">
              Generate your first insights report to start tracking your mood patterns over time.
            </p>
          </div>

          {/* Back to Landing Button */}
          <div className="flex justify-center mt-6 pt-4 border-t border-gray-700">
            <button
              onClick={handleBackToLanding}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg 
             transition-all duration-200 hover:scale-105 flex items-center space-x-2
             border border-gray-500"
            >
              <span>←</span>
              <span>Back to AI Insights</span>
            </button>
          </div>
        </div>
      );
    }
    if (!insightsData) return null;
    return (
      <div className="dashboard-box dashboard-ai-insights">
        <div className="text-center">
          <h3 className="dashboard-box-title mt-4 !mb-2">
            {reportType === 'previous' ? 'Previous AI Insights Report' : 'Current AI Insights Report'}
          </h3>
          {insightsData.analysisDate && (
            <p className="text-gray-400 text-sm mb-6">
              Generated on: {formatGeneratedDate(insightsData.analysisDate)}
            </p>
          )}
        </div>

        {/* Weekly Insights */}
        <div className="mb-6">
          <h4 className="text-white font-medium mb-3">📅 Weekly Analysis</h4>
          <div className="space-y-2">
            {insightsData.insights.weekly.findings.map((finding: string, index: number) => (
              <p key={index} className="text-gray-300 text-sm">• {finding}</p>
            ))}
            {insightsData.insights.weekly.recommendation && (
              <p className="text-blue-400 text-sm mt-2">
                💡 {insightsData.insights.weekly.recommendation}
              </p>
            )}
          </div>
        </div>

        {/* Monthly Insights */}
        <div className="mb-6">
          <h4 className="text-white font-medium mb-3">📊 Monthly Analysis</h4>
          <div className="space-y-2">
            {insightsData.insights.monthly.findings.map((finding: string, index: number) => (
              <p key={index} className="text-gray-300 text-sm">• {finding}</p>
            ))}
            {insightsData.insights.monthly.recommendation && (
              <p className="text-blue-400 text-sm mt-2">
                💡 {insightsData.insights.monthly.recommendation}
              </p>
            )}
          </div>
        </div>

        {/* Back to Landing Button */}
        <div className="flex justify-center mt-6 pt-4 border-t border-gray-700">
          <button
            onClick={handleBackToLanding}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg 
             transition-all duration-200 hover:scale-105 flex items-center space-x-2
             border border-gray-500"
          >
            <span>←</span>
            <span>Back to AI Insights</span>
          </button>
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
              <ThroughDayView />
              <MoodHistory />
              {(insightsData || reportType) ? <AIInsightsDisplay /> : <AIInsightsLanding />}
            </div>

          </>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;