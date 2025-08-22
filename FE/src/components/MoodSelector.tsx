// src/components/MoodSelector.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import NET from 'vanta/dist/vanta.net.min';
import WAVES from 'vanta/dist/vanta.waves.min';

type Mood = {
  name: string;
  emoji: string;
  bgColor: string;
  hoverColor: string;
};

interface MoodSelectorProps {
  selectedMood: string | null;
  onSelectMood: (mood: string) => void;
  error?: string | null;           // ← Add error
  onClearError?: () => void;       // ← Add clear function
}

const MoodSelector: React.FC<MoodSelectorProps> = ({ selectedMood, onSelectMood, error, onClearError }) => {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  // Function to calculate scale based on distance from hovered button
  const getScale = (currentIndex: number): number => {
    if (hoveredIndex === null) return 1; // No hover, normal size

    const distance = Math.abs(currentIndex - hoveredIndex);

    if (distance === 0) return 1.25;   // Peak - much bigger (40% larger)
    if (distance === 1) return 1.10;  // Adjacent - big (25% larger)
    if (distance === 2) return 1;   // Second adjacent - medium (10% larger)
    if (distance === 3) return 0.9;  // Third adjacent - small (5% larger)
    return 0.85; // Far buttons get smaller for contrast (5% smaller)
  };

  const moods: Mood[] = [
    { name: 'Excited', emoji: '😃', bgColor: 'bg-yellow-300', hoverColor: 'hover:bg-yellow-400' },
    { name: 'Happy', emoji: '😊', bgColor: 'bg-yellow-200', hoverColor: 'hover:bg-yellow-300' },
    { name: 'Calm', emoji: '😌', bgColor: 'bg-blue-200', hoverColor: 'hover:bg-blue-300' },
    { name: 'Tired', emoji: '😴', bgColor: 'bg-purple-200', hoverColor: 'hover:bg-purple-300' },
    { name: 'Anxious', emoji: '😰', bgColor: 'bg-purple-300', hoverColor: 'hover:bg-purple-400' },
    { name: 'Angry', emoji: '😠', bgColor: 'bg-red-300', hoverColor: 'hover:bg-red-400' },
    { name: 'Sad', emoji: '😢', bgColor: 'bg-blue-300', hoverColor: 'hover:bg-blue-400' },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      // console.log('=== VANTA DEBUGGING ===');
      // console.log('vantaRef.current:', vantaRef.current);
      // console.log('Element dimensions:', {
      //   width: vantaRef.current?.offsetWidth,
      //   height: vantaRef.current?.offsetHeight,
      //   clientWidth: vantaRef.current?.clientWidth,
      //   clientHeight: vantaRef.current?.clientHeight
      // });

      try {
        if (!vantaEffect.current && vantaRef.current) {
          console.log('Initializing Vanta Waves...');

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

          // console.log('Vanta effect created:', vantaEffect.current);

          // Force a resize after creation
          setTimeout(() => {
            if (vantaEffect.current && vantaEffect.current.resize) {
              // console.log('Forcing Vanta resize...');
              vantaEffect.current.resize();
            }

            // Check canvas after resize
            const canvas = vantaRef.current?.querySelector('canvas');
            // console.log('Canvas after resize:', canvas ? {
            //   width: canvas.width,
            //   height: canvas.height,
            //   styleWidth: canvas.style.width,
            //   styleHeight: canvas.style.height,
            //   display: canvas.style.display,
            //   visibility: canvas.style.visibility
            // } : 'No canvas');
          }, 500);
        }
      } catch (error) {
        console.error('Error initializing Vanta Waves:', error);
      }
    }, 100); // Reduced delay

    return () => {
      clearTimeout(timer);
      try {
        if (vantaEffect.current) {
          // console.log('Destroying Vanta effect...');
          vantaEffect.current.destroy();
          vantaEffect.current = null;
        }
      } catch (error) {
        // console.error('Error destroying Vanta effect:', error);
      }
    };
  }, []);
  // Handle error toast display and auto-hide
  useEffect(() => {
    if (error) {
      setShowToast(true);

      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        setShowToast(false);
        setTimeout(() => {
          onClearError?.();
        }, 300);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setShowToast(false);
    }
  }, [error, onClearError]);

  // Manual close handler
  const handleCloseToast = () => {
    setShowToast(false);
    setTimeout(() => {
      onClearError?.();
    }, 300);
  };
  return (
    <div ref={vantaRef} className="vanta-waves-container">
      <h1 className="text-white text-4xl md:text-6xl font-bold text-center mb-6">How Are You Feeling Right Now?</h1>
      <p className="text-white text-2xl md:text-3xl text-center mb-10">Select a Mood</p>
      <div className="flex flex-wrap justify-center gap-x-8 gap-y-6">
        {moods.map((mood, index) => (
          <button
            key={mood.name}
            onClick={() => {
              console.log('Button clicked:', mood.name);
              onSelectMood(mood.name)
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{
              transform: `scale(${getScale(index)})`,
            }}
            className={`
      mood-button
      ${selectedMood === mood.name ? 'selected' : ''}
    `}
          >
            <span>{mood.emoji}</span>
            <span>{mood.name}</span>
          </button>
        ))}
      </div>
      {/* Error Toast Notification */}
      {/* Error Toast Notification */}
      {/* Error Toast Notification */}
{error && (
  <div
    style={{
      position: 'fixed',
      bottom: '24px',
      left: '24px',
      zIndex: 9999,
      maxWidth: '384px',
      minWidth: '300px',
      transform: showToast ? 'translateX(0)' : 'translateX(-120%)',
      opacity: showToast ? 1 : 0,
      transition: 'all 300ms ease-in-out',
      backgroundColor: '#ef4444',
      color: 'white',
      padding: '16px 24px',
      borderRadius: '8px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>Error</div>
        <div style={{ fontSize: '14px' }}>{error}</div>
      </div>
      <button
        onClick={handleCloseToast}
        style={{
          marginLeft: '16px',
          color: 'white',
          fontSize: '20px',
          fontWeight: 'bold',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0',
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
      >
        ×
      </button>
    </div>
  </div>
)}
    </div>
  );
};

export default MoodSelector;