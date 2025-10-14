// src/components/MoodSelector.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// import NET from 'vanta/dist/vanta.net.min';
import WAVES from 'vanta/dist/vanta.waves.min';
import { useNotification } from '../contexts/NotificationContext';

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
  isSubmittingMood?: boolean;
}

const MoodSelector: React.FC<MoodSelectorProps> = ({ selectedMood, onSelectMood, error, onClearError, isSubmittingMood = false }) => {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);

  const { showNotification } = useNotification(); // ADD THIS LINE
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
    if (error) {
      showNotification({
        type: 'error',
        message: error
      });

      // Clear the error after showing notification
      if (onClearError) {
        const timer = setTimeout(() => {
          onClearError();
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [error]);

  useEffect(() => {
    const timer = setTimeout(() => {

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
            //const canvas = vantaRef.current?.querySelector('canvas');
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
  // Handle loading overlay with 300ms delay
  useEffect(() => {
    let timeoutId: number;

    if (isSubmittingMood) {
      // Start timer - show loading overlay if operation takes > 300ms
      timeoutId = setTimeout(() => {
        setShowLoadingOverlay(true);
      }, 300);
    } else {
      // Reset immediately when submission completes
      setShowLoadingOverlay(false);
    }

    // Cleanup timeout on unmount or when isSubmitting changes
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isSubmittingMood]);
  
  return (
    <div ref={vantaRef} className="vanta-waves-container">
      <h1 className="text-white text-4xl md:text-6xl font-bold text-center mb-6">How Are You Feeling Right Now?</h1>
      <p className="text-white text-2xl md:text-3xl text-center mb-10">Select a Mood</p>
      <div className="flex flex-wrap justify-center gap-x-8 gap-y-6">
        {moods.map((mood, index) => (
          <button
            key={mood.name}
            onClick={() => {
              if (isSubmittingMood) return;
              console.log('Button clicked:', mood.name);
              onSelectMood(mood.name)
            }}
            disabled={isSubmittingMood}
            onMouseEnter={() => !isSubmittingMood && setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{
              transform: `scale(${getScale(index)})`,
              cursor: isSubmittingMood ? 'not-allowed' : 'pointer',  // ← ADD THIS
              opacity: isSubmittingMood ? 0.5 : 1,  // ← ADD THIS
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
      {/* Loading Overlay - shown after 300ms delay */}
      {showLoadingOverlay && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              border: '6px solid rgba(255, 255, 255, 0.3)',
              borderTop: '6px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <p
            style={{
              color: 'white',
              marginTop: '20px',
              fontSize: '18px',
              fontWeight: '500',
            }}
          >
            Saving your mood...
          </p>
        </div>
      )}

      <style>{`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`}</style>
    </div>
  );
};

export default MoodSelector;