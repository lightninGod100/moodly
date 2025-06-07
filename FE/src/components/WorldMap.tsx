// src/components/WorldMap.tsx
import React, { useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
} from 'react-simple-maps';
import type { CountryStats } from '../services/GlobalStatsService';

// Mood color mapping
const moodColors: { [key: string]: string } = {
  Happy: '#22c55e',    // Green
  Excited: '#f59e0b',  // Amber  
  Calm: '#3b82f6',     // Blue
  Tired: '#8b5cf6',    // Purple
  Sad: '#6366f1',      // Indigo
  Angry: '#ef4444',    // Red
  Anxious: '#f97316',  // Orange
  default: '#9ca3af'   // Gray for no data
};

interface WorldMapProps {
  countryData: CountryStats;
}

const WorldMap: React.FC<WorldMapProps> = ({ countryData }) => {
  const [tooltip, setTooltip] = useState<{ 
    x: number; 
    y: number; 
    country: string; 
    data: { topMood: string; userCount: number; moods?: any } 
  } | null>(null);

  // Get country color based on dominant mood
  const getCountryColor = (countryName: string): string => {
    const data = countryData[countryName];
    if (!data) return moodColors.default;
    return moodColors[data.topMood] || moodColors.default;
  };

  // Handle mouse events
  const handleMouseEnter = (geo: any, event: React.MouseEvent) => {
    // Use the correct property name (lowercase 'name')
    const countryName = geo.properties.name || geo.properties.NAME || geo.properties.ADMIN;
    const data = countryData[countryName];
    
    if (countryName) {
      setTooltip({
        x: event.clientX,
        y: event.clientY,
        country: countryName,
        data: data || { 
          topMood: 'No Data', 
          userCount: 0, 
          moods: { Happy: 0, Excited: 0, Calm: 0, Tired: 0, Sad: 0, Angry: 0, Anxious: 0 }
        }
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (tooltip) {
      setTooltip(prev => prev ? {
        ...prev,
        x: event.clientX,
        y: event.clientY
      } : null);
    }
  };

  return (
    <div className="relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden">
      {/* World Map */}
      <ComposableMap
        projectionConfig={{
          scale: 140,
          center: [0, 20]
        }}
        style={{ width: '100%', height: '100%' }}
        onMouseMove={handleMouseMove}
      >
        <Geographies geography="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json">
          {({ geographies }) =>
            geographies.map((geo) => {
              const countryName = geo.properties.name || geo.properties.NAME || geo.properties.ADMIN;
              const hasData = !!countryData[countryName];
              
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={(event) => handleMouseEnter(geo, event)}
                  onMouseLeave={handleMouseLeave}
                  style={{
                    default: {
                      fill: getCountryColor(countryName),
                      stroke: '#374151',
                      strokeWidth: 0.5,
                      outline: 'none',
                      opacity: hasData ? 1 : 0.3
                    },
                    hover: {
                      fill: getCountryColor(countryName),
                      stroke: '#f3f4f6',
                      strokeWidth: 2,
                      outline: 'none',
                      opacity: 1,
                      cursor: 'pointer'
                    },
                    pressed: {
                      fill: getCountryColor(countryName),
                      stroke: '#f3f4f6',
                      strokeWidth: 2,
                      outline: 'none'
                    }
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-10 bg-white border-2 border-black p-3 rounded shadow-lg pointer-events-none max-w-xs"
          style={{
            left: Math.min(tooltip.x + 10, window.innerWidth - 250),
            top: tooltip.y - 80,
          }}
        >
          <div className="font-bold text-lg mb-1">{tooltip.country}</div>
          <div className="text-sm space-y-1">
            <div>
              <span className="font-medium">Top Mood:</span> {tooltip.data.topMood}
            </div>
            <div>
              <span className="font-medium">Users:</span> {tooltip.data.userCount.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white border-2 border-black p-3 rounded">
        <div className="text-sm font-bold mb-2">Mood Colors</div>
        <div className="grid grid-cols-2 gap-1 text-xs">
          {Object.entries(moodColors).map(([mood, color]) => (
            mood !== 'default' && (
              <div key={mood} className="flex items-center gap-1">
                <div
                  className="w-3 h-3 border border-gray-400"
                  style={{ backgroundColor: color }}
                ></div>
                <span>{mood}</span>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorldMap;