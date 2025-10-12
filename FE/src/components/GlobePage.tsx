// src/components/GlobePage.tsx
import React, { useState, useEffect } from 'react';
import { fetchWorldStats } from '../services/GlobalStatsService';
import type { GlobalMoodStats, CountryStats } from '../services/GlobalStatsService';
import WorldMap from './WorldMap';
import { moodColors } from './WorldMap';
import { useNotification } from '../contexts/NotificationContext';
// Mood emoji mapping
// const moodEmojis: { [key: string]: string } = {
//   Happy: '😊',
//   Excited: '😃', 
//   Calm: '😌',
//   Tired: '😴',
//   Sad: '😢',
//   Angry: '😠',
//   Anxious: '😰'
// };

//const moodOrder = ['Happy', 'Excited', 'Calm', 'Tired', 'Sad', 'Angry', 'Anxious'];

// Interface for all world stats data
interface GlobalStatsData {
  global: GlobalMoodStats;
  frequency: GlobalMoodStats;  
  countries: CountryStats;
}

const GlobePage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('live');
  const [worldStats, setWorldStats] = useState<GlobalStatsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showNotification } = useNotification(); // ADD THIS LINE
  
 
 

  // Ensure no body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Load initial data
  useEffect(() => {
    loadWorldStats(selectedPeriod);
  }, []);

  // Load all world stats for selected period
  const loadWorldStats = async (period: string) => {
    try {
      setIsLoading(true);
 
      const stats = await fetchWorldStats(period);
      setWorldStats(stats);
    } catch (err) {
      showNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Something seems wrong, please refresh or come back later'
      });
      setWorldStats({
        global: {
          Happy: 0,
          Excited: 0,
          Calm: 0,
          Tired: 0,
          Sad: 0,
          Angry: 0,
          Anxious: 0
        },
        frequency: {
          Happy: 0,
          Excited: 0,
          Calm: 0,
          Tired: 0,
          Sad: 0,
          Angry: 0,
          Anxious: 0
        },
        countries: {}
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle period change
  const handlePeriodChange = async (period: string) => {
    setSelectedPeriod(period);
    await loadWorldStats(period);
  };

  // Get display text for periods
  const getPeriodDisplayText = (period: string): string => {
    switch (period) {
      case 'live': return 'Live';
      case 'today': return 'Today';
      case 'week': return 'Week';
      case 'month': return 'Month';
      default: return period;
    }
  };

  return (
    <div 
      className="relative bg-black" 
      style={{ 
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#111'
      }}
    >
      {/* Map Container - Full screen */}
      <div className="absolute bg-black" style={{
      top: '4.2rem', 
      left: '0',
      right: '0', 
      bottom: '0',
      
    }}>
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center" style={{ height: '100%' }}>
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full border-b-2 border-white" style={{ height: '2rem', width: '2rem' }}></div>
              <p className="text-gray-400" style={{ marginTop: '1rem' }}>Loading global mood data...</p>
            </div>
          </div>
        )}



        {/* Map */}
        {worldStats && !isLoading && (
          <WorldMap countryData={worldStats.countries} />
        )}
      </div>

      {/* Overlay Sidebar - Positioned absolutely */}
      <div 
  className="absolute left-3 flex flex-col pointer-events-none" 
  style={{ 
    top: '4.2rem',  // Same logic as map container
    width: '18rem', 
    padding: '1rem', 
    height: 'calc(100% - 4.2rem)' // Adjust height too
  }}
>
        {/* Time Filter Tabs - Make clickable */}
        {!isLoading && (
        <div style={{ marginBottom: '1rem' }} className="pointer-events-auto">
          <div className="flex border border-gray-600 rounded overflow-hidden" style={{ backgroundColor: 'rgba(31, 41, 55, 0.9)' }}>
            {['live', 'today', 'week', 'month'].map((period) => (
              <button
                key={period}
                onClick={() => handlePeriodChange(period)}
                disabled={isLoading}
                className={`flex-1 text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-black text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ padding: '0.5rem' }}
              >
                {getPeriodDisplayText(period)}
              </button>
            ))}
          </div>
        </div>
        )}
                
        {!isLoading && worldStats && (
          <div className="flex flex-col pointer-events-auto" style={{ gap: '1rem' }}>
            {/* Dominant Mood Stats - Semi-transparent dark gray */}
            {/* Dominant Mood Stats - Semi-transparent dark gray */}
<div className="text-white rounded" style={{ padding: '1rem', backgroundColor: 'rgba(31, 41, 55, 0.85)' }}>
  <div className="flex items-center justify-center" style={{ marginBottom: '1rem', position: 'relative' }}>
    <h2 className="font-bold text-center" style={{ fontSize: '1.125rem', marginRight: '0.5rem' }}>Dominant Mood</h2>
    <div style={{ position: 'relative', display: 'inline-block' }}>
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
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <path d="M12 17h.01"/>
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
        The mood that most people around the world are <br />feeling most often in the selected timeframe.
      </div>
    </div>
  </div>
  <div className="space-y-1">
  {Object.entries(worldStats?.global || {})
    .sort(([, percentageA], [, percentageB]) => (percentageB || 0) - (percentageA || 0))
    .map(([mood, percentage], index, sortedArray) => (
    <div key={mood}>
      <div className="flex justify-between items-center" style={{ paddingTop: '0.125rem', paddingBottom: '0.125rem' }}>
        <div className="flex items-center" style={{ gap: '0.5rem' }}>
          <div 
            className="rounded-full" 
            style={{ 
              width: '8px', 
              height: '8px', 
              backgroundColor: moodColors[mood] || moodColors.default 
            }}
          />
          <span style={{ fontSize: '0.875rem' }}>{mood}</span>
        </div>
        <span style={{ fontSize: '0.875rem' }}>{percentage || 0}% Users</span>
      </div>
      {index < sortedArray.length - 1 && (
        <div 
          className="border-t border-white" 
          style={{ marginLeft: '0.05rem', marginRight: '0.05rem', marginTop: '0.25rem', marginBottom: '0.25rem' , opacity: 0.5}}
        />
      )}
    </div>
  ))}
  
  {/* Add this "No data" message */}
  {(!worldStats?.global || Object.keys(worldStats.global).length === 0) && (
    <div className="text-gray-400 text-center" style={{ fontSize: '0.875rem', padding: '0.5rem' }}>
      No data available
    </div>
  )}
</div>
            </div>

            {/* Top Modes Stats - Semi-transparent dark gray */}
            {/* Top Modes Stats - Semi-transparent dark gray */}
<div className="text-white rounded" style={{ padding: '1rem', backgroundColor: 'rgba(31, 41, 55, 0.85)' }}>
  <div className="flex items-center justify-center" style={{ marginBottom: '1rem', position: 'relative' }}>
    <h2 className="font-bold text-center" style={{ fontSize: '1.125rem', marginRight: '0.5rem' }}>Top Modes</h2>
    <div style={{ position: 'relative', display: 'inline-block' }}>
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
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <path d="M12 17h.01"/>
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
        Shows which moods are being logged most frequently <br/>across all users worldwide in this timeframe.
      </div>
    </div>
  </div>
  <div className="space-y-1">
  {Object.entries(worldStats?.frequency || {})
    .sort(([, percentageA], [, percentageB]) => (percentageB || 0) - (percentageA || 0))
    .map(([mood, percentage], index, sortedArray) => (
    <div key={mood}>
      <div className="flex justify-between items-center" style={{ paddingTop: '0.125rem', paddingBottom: '0.125rem' }}>
        <div className="flex items-center" style={{ gap: '0.5rem' }}>
          <div 
            className="rounded-full" 
            style={{ 
              width: '8px', 
              height: '8px', 
              backgroundColor: moodColors[mood] || moodColors.default 
            }}
          />
          <span style={{ fontSize: '0.875rem' }}>{mood}</span>
        </div>
        <span style={{ fontSize: '0.875rem' }}>{percentage || 0}% Times</span>
      </div>
      {index < sortedArray.length - 1 && (
        <div 
          className="border-t border-white" 
          style={{ marginLeft: '0.05rem', marginRight: '0.05rem', marginTop: '0.25rem', marginBottom: '0.25rem' , opacity: 0.5}}
        />
      )}
    </div>
  ))}
  
  {/* Add this "No data" message */}
  {(!worldStats?.frequency || Object.keys(worldStats.frequency).length === 0) && (
    <div className="text-gray-400 text-center" style={{ fontSize: '0.875rem', padding: '0.5rem' }}>
      No data available
    </div>
  )}
</div>
            </div>
          </div>
        )}
      </div>

      {/* Data Info Footer - Positioned at bottom */}
      {worldStats && !isLoading && (
        <div className="absolute bottom-0 left-0 right-0 text-center text-gray-400 text-sm pointer-events-none" style={{ padding: '1rem' }}>
          <p>Showing data for: <strong>{getPeriodDisplayText(selectedPeriod)}</strong></p>
          <p style={{ marginTop: '0.25rem' }}>
            {selectedPeriod === 'live' && 'Data from the last 10 minutes'}
            {selectedPeriod === 'today' && 'Data from the last 24 hours'}
            {selectedPeriod === 'week' && 'Data from the last 7 days'}
            {selectedPeriod === 'month' && 'Data from the last 30 days'}
          </p>
        </div>
      )}
    </div>
  );
};

export default GlobePage;