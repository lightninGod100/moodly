// src/components/GlobePage.tsx
import React, { useState, useEffect } from 'react';
import { fetchGlobalStats} from '../services/WorldStatsService';

// Mood emoji mapping
const moodEmojis: { [key: string]: string } = {
  Happy: '😊',
  Excited: '😃', 
  Calm: '😌',
  Tired: '😴',
  Sad: '😢',
  Angry: '😠',
  Anxious: '😰'
};

const moodOrder = ['Happy', 'Excited', 'Calm', 'Tired', 'Sad', 'Angry', 'Anxious'];

const GlobePage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('live');
  const [globalStats, setGlobalStats] = useState<GlobalMoodStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadGlobalStats(selectedPeriod);
  }, []);

  // Load global stats for selected period
  const loadGlobalStats = async (period: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const stats = await fetchGlobalStats(period);
      setGlobalStats(stats);
    } catch (err) {
      console.error('Failed to load global stats:', err);
      setError(err instanceof Error ? err.message : 'Something seems wrong, please refresh or come back later');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle period change
  const handlePeriodChange = async (period: string) => {
    setSelectedPeriod(period);
    await loadGlobalStats(period);
  };

  // Get display text for periods
  const getPeriodDisplayText = (period: string): string => {
    switch (period) {
      case 'live': return 'Live';
      case 'today': return 'Today';
      case 'week': return 'Last 7 Days';
      case 'month': return 'Last 30 Days';
      default: return period;
    }
  };

  return (
    <div className="text-center py-8">
      {/* Header - will be shown by navbar, keeping for context */}
      <h1 className="text-3xl font-bold mb-8">Global Mood Statistics</h1>
      
      {/* Time Filter Tabs */}
      <div className="mb-8">
        <div className="inline-flex border-2 border-black">
          {['live', 'today', 'week', 'month'].map((period) => (
            <button
              key={period}
              onClick={() => handlePeriodChange(period)}
              disabled={isLoading}
              className={`px-6 py-3 text-lg font-medium border-r-2 border-black last:border-r-0 ${
                selectedPeriod === period
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-gray-100'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {getPeriodDisplayText(period)}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          <p className="mt-4 text-gray-600">Loading global mood data...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="py-12">
          <div className="bg-red-50 border-2 border-red-300 p-6 max-w-md mx-auto">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => loadGlobalStats(selectedPeriod)}
              className="bg-red-600 text-white px-4 py-2 border-2 border-red-600 hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Global Mood Statistics Grid */}
      {globalStats && !isLoading && !error && (
        <>
          <div className="mb-12">
            <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto">
              {moodOrder.map((mood) => (
                <div
                  key={mood}
                  className="border-2 border-black p-6 flex flex-col items-center min-w-[150px]"
                >
                  {/* Mood Emoji */}
                  <div className="text-4xl mb-2">
                    {moodEmojis[mood]}
                  </div>
                  
                  {/* Mood Name */}
                  <div className="font-bold text-lg mb-2">
                    {mood}
                  </div>
                  
                  {/* Percentage */}
                  <div className="text-gray-700">
                    {globalStats[mood as keyof GlobalMoodStats]}% Users
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

          {/* Data Info */}
          <div className="text-center text-gray-500 text-sm mt-8">
            <p>Showing data for: <strong>{getPeriodDisplayText(selectedPeriod)}</strong></p>
            <p className="mt-1">
              {selectedPeriod === 'live' && 'Data from the last 10 minutes'}
              {selectedPeriod === 'today' && 'Data from the last 24 hours'}
              {selectedPeriod === 'week' && 'Data from the last 7 days'}
              {selectedPeriod === 'month' && 'Data from the last 30 days'}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default GlobePage;