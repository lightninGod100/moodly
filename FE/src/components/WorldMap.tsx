// src/components/WorldMap.tsx
import React, { useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';
import type { CountryStats } from '../services/GlobalStatsService';

// Mood color mapping
export const moodColors: { [key: string]: string } = {
  Happy: '#9EFD00',    // Vibrant Green
  Excited: '#E6E600',  // Yellow  
  Calm: '#1E90FF',     // Vibrant Blue
  Tired: '#33414A',    // 
  Sad: '#651e58',      // 
  Angry: '#FF0000',    // Red
  Anxious: '#448184',  // 
  default: '#2B2B2B'   // Gray for no data
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
  const [position, setPosition] = useState({ coordinates: [0, 3], zoom: 1.4 });


  // Handle zoom
  const handleZoomIn = () => {
    if (position.zoom >= 4) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.2 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.2 }));
  };

  const handleReset = () => {
    setPosition({ coordinates: [0, 3], zoom: 1.4 });
  };

  const handleMoveEnd = (position: any) => {
    const [longitude, latitude] = position.coordinates;
    const zoom = position.zoom;

    const center = [0, 0]; // <-- MAKE SURE this is your true map center (e.g., [lng, lat])

    // Define the threshold for snapping back to center
    const longitudeThreshold = 180;
    const latitudeThreshold = 90;

    const isOutOfBounds =
      Math.abs(longitude) > longitudeThreshold || Math.abs(latitude) > latitudeThreshold;

    if (isOutOfBounds) {
      setPosition({
        coordinates: center,
        zoom,
      });
    } else {
      // Stay where you are (no clamping here unless you want to)
      setPosition({
        coordinates: [longitude, latitude],
        zoom,
      });
    }
  };

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
  // Add helper function to get top 3 moods
  const getTop3Moods = (moods: any) => {
    if (!moods) return [];
    return Object.entries(moods)
      .map(([mood, percentage]) => ({ mood, percentage: percentage as number }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);
  };

  return (
    <div className="relative w-full h-full"style={{ backgroundColor: '#111' }}>
      <style>{`
        .rsm-zoomable-group {
          touch-action: none;
          user-select: none;
        }
        .rsm-zoomable-group > g {
          pointer-events: auto !important;
        }
        .rsm-zoomable-group.dragging {
          cursor: default !important;
        }
      `}</style>
      {/* World Map */}
      <ComposableMap
        projectionConfig={{
          scale: 140,
          center: [0, 20]
        }}
        style={{ width: '100%', height: '100%' }}
        onMouseMove={handleMouseMove}
      >
        <ZoomableGroup
          zoom={position.zoom}
          minZoom={1}
          maxZoom={4}
          center={position.coordinates as [number, number]}
          onMoveEnd={handleMoveEnd}
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
                        stroke: '#000000',
                        strokeWidth: 0.5,
                        outline: 'none',
                        opacity: hasData ? 1 : 1
                      },
                      hover: {
                        fill: getCountryColor(countryName),
                        stroke: '#FFFFFF',
                        strokeWidth: 1,
                        outline: 'none',
                        opacity: 1,
                        cursor: 'pointer'
                      },
                      pressed: {
                        fill: getCountryColor(countryName),
                        stroke: '#e5e7eb',
                        strokeWidth: 2,
                        outline: 'none'
                      }
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip */}


      {/* Enhanced Tooltip */}
      {tooltip && (
        <div
          className="absolute z-10 bg-gray-100 border border-gray-300 text-black p-4 rounded-lg shadow-lg pointer-events-none"
          style={{
            left: Math.min(tooltip.x + 10, window.innerWidth - 280),
            top: tooltip.y - 120,
            minWidth: '260px'
          }}
        >
          <div className="font-bold text-lg mb-3 pb-2 border-b-2 border-black ">{tooltip.country}</div>
          {/* Check if no data available */}
          {tooltip.data.userCount === 0 ? (
            <div className="text-sm text-gray-700 italic">
              No Data Available
            </div>
          ) :
            (
              <div className="space-y-2">
                {getTop3Moods(tooltip.data.moods).map(({ mood, percentage }) => (
                  <div key={mood} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{mood}</span>
                      <span className="text-sm font-bold">{percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: moodColors[mood] || moodColors.default
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>)}
        </div>
      )}

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
  <button
    onClick={handleZoomIn}
    className="bg-gray-900 border border-gray-700 text-white w-10 h-10 rounded hover:bg-gray-800 transition-colors flex items-center justify-center"
    title="Zoom In"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  </button>
  
  <button
    onClick={handleReset}
    className="bg-gray-900 border border-gray-700 text-white w-10 h-10 rounded hover:bg-gray-800 transition-colors flex items-center justify-center"
    title="Reset View"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
      <path d="M21 3v5h-5"/>
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
      <path d="M3 21v-5h5"/>
    </svg>
  </button>
  
  <button
    onClick={handleZoomOut}
    className="bg-gray-900 border border-gray-700 text-white w-10 h-10 rounded hover:bg-gray-800 transition-colors flex items-center justify-center"
    title="Zoom Out"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  </button>
</div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-gray-900 border border-gray-700 text-white p-3 rounded">
        <div className="text-sm font-bold mb-2 text-center">Mood Colors</div>
        <div className="grid grid-cols-2 gap-1 text-xs">
          {Object.entries(moodColors).map(([mood, color]) => (
            mood !== 'default' && (
              <div key={mood} className="flex items-center gap-1">
                <div
                  className="rounded-full w-3 h-3 border border-gray-600"
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