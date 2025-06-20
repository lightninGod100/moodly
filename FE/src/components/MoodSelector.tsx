// src/components/MoodSelector.tsx
import React, { useEffect, useRef } from 'react';
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
}

const MoodSelector: React.FC<MoodSelectorProps> = ({ selectedMood, onSelectMood }) => {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);

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
      console.log('=== VANTA DEBUGGING ===');
      console.log('vantaRef.current:', vantaRef.current);
      console.log('Element dimensions:', {
        width: vantaRef.current?.offsetWidth,
        height: vantaRef.current?.offsetHeight,
        clientWidth: vantaRef.current?.clientWidth,
        clientHeight: vantaRef.current?.clientHeight
      });
      
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
            color: 0x980720,
            shininess: 50,
            waveHeight: 20,
            waveSpeed: 1.2,
            zoom: 0.75
          });
          
          console.log('Vanta effect created:', vantaEffect.current);
          
          // Force a resize after creation
          setTimeout(() => {
            if (vantaEffect.current && vantaEffect.current.resize) {
              console.log('Forcing Vanta resize...');
              vantaEffect.current.resize();
            }
            
            // Check canvas after resize
            const canvas = vantaRef.current?.querySelector('canvas');
            console.log('Canvas after resize:', canvas ? {
              width: canvas.width,
              height: canvas.height,
              styleWidth: canvas.style.width,
              styleHeight: canvas.style.height,
              display: canvas.style.display,
              visibility: canvas.style.visibility
            } : 'No canvas');
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
          console.log('Destroying Vanta effect...');
          vantaEffect.current.destroy();
          vantaEffect.current = null;
        }
      } catch (error) {
        console.error('Error destroying Vanta effect:', error);
      }
    };
  }, []);
  
  return (
    <div ref={vantaRef} className="vanta-waves-container">
      <h1 className="text-white text-4xl md:text-6xl font-bold text-center mb-6">How Are You Feeling Right Now?</h1>
      <p className="text-white text-2xl md:text-3xl text-center mb-10">Select a Mood</p>
      <div className="flex flex-wrap justify-center gap-x-8 gap-y-6">
        {moods.map((mood) => (
          <button
            key={mood.name}
            onClick={() => {
              console.log('Button clicked:', mood.name);
              onSelectMood(mood.name)
            }}
            className={`
              border-2 border-gray-300 bg-transparent hover:border-gray-400
              ${selectedMood === mood.name ? 'ring-2 ring-blue-500' : ''}
              rounded-lg p-4 flex flex-col items-center transition-all min-w-[100px]
            `}
          >
            <span className="text-white text-2xl md:text-3xl">{mood.emoji}</span>
            <span className="text-white text-2xl md:text-3xl">{mood.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MoodSelector;