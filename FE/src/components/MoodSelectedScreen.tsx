// src/components/MoodSelectedScreen.tsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import WAVES from 'vanta/dist/vanta.waves.min';

// Define valid mood types
type MoodType = 'Happy' | 'Excited' | 'Calm' | 'Tired' | 'Anxious' | 'Angry' | 'Sad';

// Mood color mapping (hex to Vanta-compatible format)
export const moodColors: { [key: string]: string } = {
  Happy: '#136025',    // Green
  Excited: '#686a1b',  // Amber  
  Calm: '#221f83',     // Blue
  Tired: '#2B373F',    // Purple
  Sad: '#400f36',      // Indigo
  Angry: '#8a1212',    // Red
  Anxious: '#7473e',  // Orange
  default: '#4b5563'   // Gray for no data
};

// Convert hex to Vanta color format (remove # and convert to number)
const hexToVantaColor = (hex: string): number => {
  return parseInt(hex.replace('#', ''), 16);
};

// Helper functions outside component (better performance)
const getMoodDependentMessage = (mood: string): string => {
  const messages: Record<MoodType, string> = {
    'Happy': 'Glad To hear ! You are Feeling Happy Right Now',
    'Excited': 'Amazing ! You are Feeling Excited Right Now',
    'Calm': 'Wonderful ! You are Feeling Calm Right Now',
    'Tired': 'Take some rest ! You are Feeling Tired Right Now',
    'Anxious': 'Take deep breaths ! You are Feeling Anxious Right Now',
    'Angry': 'Take it easy ! You are Feeling Angry Right Now',
    'Sad': 'Hope you feel better ! You are Feeling Sad Right Now'
  };
  return messages[mood as MoodType] || `You are Feeling ${mood} Right Now`;
};

const getStatMessage = (mood: string): string => {
  const percentages: Record<MoodType, string> = {
    'Happy': '15%',
    'Excited': '8%',
    'Calm': '12%',
    'Tired': '20%',
    'Anxious': '18%',
    'Angry': '5%',
    'Sad': '10%'
  };
  const percentage = percentages[mood as MoodType] || '12%';
  return `You are among ${percentage} of users feeling ${mood} right now`;
};

// Short mood-related phrases for left side bubbles
const getMoodPhrases = (mood: string): string[] => {
  const phrases: Record<MoodType, string[]> = {
    'Happy': ["Joy spreads", "Smile bright", "Feel good", "Positive vibes", "Cheerful heart"],
    'Excited': ["Energy flows", "Dreams alive", "Adventure awaits", "Passion ignites", "Thrilling moment"],
    'Calm': ["Peace within", "Breathe deep", "Serenity now", "Gentle waves", "Quiet mind"],
    'Tired': ["Rest needed", "Recharge time", "Gentle pause", "Recovery mode", "Peaceful rest"],
    'Anxious': ["Stay strong", "You've got this", "Courage grows", "Fears fade", "Hope rises"],
    'Angry': ["Let it go", "Find peace", "Calm returns", "Strength builds", "Balance restored"],
    'Sad': ["This too passes", "Healing comes", "Light returns", "Hope endures", "Tomorrow's better"]
  };
  return phrases[mood as MoodType] || ["Stay strong", "Keep going", "You matter", "Hope lives", "Peace comes"];
};

// Main inspirational quotes for right side bubbles
const getMainQuotes = (): string[] => {
  return [
    "The only way to do great work is to love what you do.",
    "Life is what happens to you while you're busy making other plans.",
    "The future belongs to those who believe in the beauty of their dreams.",
    "It is during our darkest moments that we must focus to see the light.",
    "The way to get started is to quit talking and begin doing.",
    "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    "In the end, we will remember not the words of our enemies, but the silence of our friends."
  ];
};

interface MoodSelectedScreenProps {
  currentMood: string;
  moodEmoji: string;
}

const MoodSelectedScreen: React.FC<MoodSelectedScreenProps> = ({ currentMood, moodEmoji }) => {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);

  // Get color for current mood
  const getMoodColor = (mood: string): number => {
    const colorHex = moodColors[mood] || moodColors.default;
    return hexToVantaColor(colorHex);
  };

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
            color: getMoodColor(currentMood),
            shininess: 50,
            waveHeight: 20,
            waveSpeed: 1.2,
            zoom: 0.75
          });
          
          console.log('Vanta effect created');
        }
      } catch (error) {
        console.error('Error initializing Vanta Waves:', error);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      try {
        if (vantaEffect.current) {
          vantaEffect.current.destroy();
          vantaEffect.current = null;
        }
      } catch (error) {
        console.error('Error destroying Vanta effect:', error);
      }
    };
  }, []);

  // Update Vanta color when mood changes
  useEffect(() => {
    if (vantaEffect.current && currentMood) {
      try {
        const newColor = getMoodColor(currentMood);
        console.log('Updating Vanta color for mood:', currentMood);
        
        if (vantaEffect.current.options) {
          vantaEffect.current.options.color = newColor;
        }
      } catch (error) {
        console.error('Error updating Vanta color:', error);
      }
    }
  }, [currentMood]);

  // Working bubble positions from the sample code
  const horizontalPositionsLeft = ['20%', '30%'];
  const horizontalPositionsRight = ['60%', '70%'];
  const moodPhrases = getMoodPhrases(currentMood);
  const quotes = getMainQuotes();

  return (
    <div ref={vantaRef} style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      
      {/* Main Content - Centered */}
      <div style={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)', 
        zIndex: 5, 
        textAlign: 'center', 
        color: 'white',
        width: '40%'
      }}>
        {/* Title */}
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>
          Your Current Mood
        </h1>
        
        {/* Enhanced Mood Display */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ position: 'relative' }}>
            {/* Glow Effect */}
            <div style={{
              position: 'absolute',
              inset: '0',
              background: 'rgba(255, 255, 255, 0.3)',
              borderRadius: '50%',
              filter: 'blur(1rem)',
              transform: 'scale(1.25)',
              animation: 'pulse 2s infinite'
            }}></div>
            
            {/* Main Mood Container */}
            <div style={{
              position: 'relative',
              border: '3px solid white',
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(15px)',
              padding: '2rem',
              borderRadius: '1rem',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '0.5rem', animation: 'bounce 2s infinite' }}>
                {moodEmoji}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                {currentMood}
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Mood Message */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '1.25rem', fontWeight: '500', lineHeight: '1.6' }}>
            {getMoodDependentMessage(currentMood)}
          </p>
        </div>
        
        {/* Compact Stats Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', maxWidth: '24rem', margin: '0 auto' }}>
          
          {/* Enhanced Stats Card */}
          <div style={{
            border: '2px solid white',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(15px)',
            padding: '1rem',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🌍</div>
            <h3 style={{ fontWeight: 'bold', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Global Connection</h3>
            <p style={{ fontSize: '0.75rem' }}>
              {getStatMessage(currentMood)}
            </p>
          </div>
          
          {/* Enhanced Inspiration Card */}
          <div style={{
            border: '2px solid white',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(15px)',
            padding: '1rem',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>✨</div>
            <h3 style={{ fontWeight: 'bold', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Mood Captured</h3>
            <p style={{ fontSize: '0.75rem' }}>
              Thank you for sharing your feelings!
            </p>
          </div>
        </div>
      </div>

      {/* Left bubbles - Realistic styling with working animations */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', pointerEvents: 'none' }}>
        {horizontalPositionsLeft.map((left, index) => (
          <React.Fragment key={`left-bubble-group-${index}`}>
            <div
              key={`left-${index}`}
              style={{
                position: 'absolute',
                bottom: '-150px',
                left,
                animation: `floatUpLeft 12s linear ${index * 6}s infinite`,
                color: 'rgba(0, 0, 0, 0.8)',
                background: `
                  radial-gradient(circle at 30% 30%, 
                    rgba(255, 255, 255, 0.8) 0%, 
                    rgba(255, 255, 255, 0.4) 30%, 
                    rgba(255, 255, 255, 0.1) 70%, 
                    rgba(255, 255, 255, 0.05) 100%
                  )
                `,
                borderRadius: '50%',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                padding: '1rem',
                backdropFilter: 'blur(8px)',
                fontSize: '0.75rem',
                fontWeight: '500',
                textAlign: 'center',
                width: '90px',
                height: '90px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `
                  inset -10px -10px 20px rgba(255, 255, 255, 0.3),
                  inset 10px 10px 20px rgba(0, 0, 0, 0.1),
                  0 5px 15px rgba(0, 0, 0, 0.2)
                `
              }}
            >
              {moodPhrases[index % moodPhrases.length]}
            </div>
            {[1, 2, 3, 4].map(fragIndex => (
              <div
                key={`left-fragment-${fragIndex}-${index}`}
                style={{
                  position: 'absolute',
                  bottom: '-150px',
                  left,
                  animation: `fragmentBurstLeft${fragIndex} 12s linear ${index * 6}s infinite`,
                  color: 'rgba(0, 0, 0, 0.6)',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 100%)',
                  borderRadius: '50%',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  backdropFilter: 'blur(4px)',
                  width: '20px',
                  height: '20px',
                  opacity: 0,
                  boxShadow: 'inset -3px -3px 6px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.1)'
                }}
              />
            ))}
          </React.Fragment>
        ))}
      </div>

 {/* Right bubbles - Realistic styling with working animations */}
 <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', pointerEvents: 'none' }}>
        {horizontalPositionsRight.map((left, index) => {
          const bubbleSize = 170 + (index * 15); // Variable sizes
          return (
            <React.Fragment key={`right-bubble-group-${index}`}>
              <div
                key={`right-${index}`}
                style={{
                  position: 'absolute',
                  bottom: '-200px',
                  left,
                  animation: `floatUpRight 12s linear ${index * 6}s infinite`,
                  color: 'rgba(0, 0, 0, 0.8)',
                  background: `
                    radial-gradient(circle at 25% 25%, 
                      rgba(255, 255, 255, 0.9) 0%, 
                      rgba(255, 255, 255, 0.5) 25%, 
                      rgba(255, 255, 255, 0.2) 60%, 
                      rgba(255, 255, 255, 0.05) 100%
                    )
                  `,
                  borderRadius: '50%',
                  border: '1.5px solid rgba(255, 255, 255, 0.7)',
                  padding: '1.5rem',
                  backdropFilter: 'blur(12px)',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  textAlign: 'center',
                  width: `${bubbleSize}px`,
                  height: `${bubbleSize}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: '1.3',
                  wordWrap: 'break-word',
                  boxShadow: `
                    inset -15px -15px 30px rgba(255, 255, 255, 0.4),
                    inset 15px 15px 30px rgba(0, 0, 0, 0.1),
                    0 8px 25px rgba(0, 0, 0, 0.25)
                  `
                }}
              >
                {quotes[index % quotes.length]}
              </div>
              {/* Fragment bubbles for realistic burst */}
              {[1, 2, 3, 4].map(fragIndex => (
                <div
                  key={`right-fragment-${fragIndex}-${index}`}
                  style={{
                    position: 'absolute',
                    bottom: '-200px',
                    left,
                    animation: `fragmentBurstRight${fragIndex} 12s linear ${index * 6}s infinite`,
                    color: 'rgba(0, 0, 0, 0.6)',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.3) 100%)',
                    borderRadius: '50%',
                    border: '0.5px solid rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(4px)',
                    width: '34px',
                    height: '34px',
                    opacity: 0,
                    boxShadow: 'inset -4px -4px 8px rgba(255,255,255,0.4), 0 3px 6px rgba(0,0,0,0.15)'
                  }}
                />
              ))}
            </React.Fragment>
          );
        })}
      </div>
        
      {/* Working animations from sample code with realistic styling */}
      <style>
        {`
@keyframes floatUpLeft {
  0% { transform: translateY(100vh) scale(1); opacity: 0; }
  10% { opacity: 1; }
  82% { opacity: 1; transform: translateY(-82vh) scale(1); }
  86% { opacity: 1; transform: translateY(-86vh) scale(1.1) rotate(2deg); }
  90% { opacity: 1; transform: translateY(-90vh) scale(1.3) rotate(-1deg); }
  93% { opacity: 0.8; transform: translateY(-93vh) scale(1.6) rotate(1deg); }
  96% { opacity: 0.4; transform: translateY(-96vh) scale(2.2) rotate(0deg); }
  100% { opacity: 0; transform: translateY(-100vh) scale(0.1) rotate(5deg); }
}

@keyframes floatUpRight {
  0% { transform: translateY(100vh) scale(1); opacity: 0; }
  10% { opacity: 1; }
  82% { opacity: 1; transform: translateY(-82vh) scale(1); }
  86% { opacity: 1; transform: translateY(-86vh) scale(1.1) rotate(-2deg); }
  90% { opacity: 1; transform: translateY(-90vh) scale(1.4) rotate(1deg); }
  93% { opacity: 0.7; transform: translateY(-93vh) scale(1.8) rotate(-1deg); }
  96% { opacity: 0.3; transform: translateY(-96vh) scale(2.5) rotate(0deg); }
  100% { opacity: 0; transform: translateY(-100vh) scale(0.05) rotate(-5deg); }
}
  /* Fragment burst animations for left bubbles */
@keyframes fragmentBurstLeft1 {
  0%, 92% { opacity: 0; transform: translateY(100vh) translateX(0) scale(0); }
  93% { opacity: 0; transform: translateY(-93vh) translateX(-20px) scale(1); }
  96% { opacity: 0; transform: translateY(-96vh) translateX(-35px) scale(0.8); }
  100% { opacity: 1; transform: translateY(-100vh) translateX(-50px) scale(1); }
}

@keyframes fragmentBurstLeft2 {
  0%, 92% { opacity: 0; transform: translateY(100vh) translateX(0) scale(0); }
  93% { opacity: 0; transform: translateY(-93vh) translateX(20px) scale(1); }
  96% { opacity: 0; transform: translateY(-96vh) translateX(40px) scale(0.7); }
  100% { opacity: 1; transform: translateY(-100vh) translateX(60px) scale(1); }
}

@keyframes fragmentBurstLeft3 {
  0%, 92% { opacity: 0; transform: translateY(100vh) translateX(0) scale(0); }
  93% { opacity: 0; transform: translateY(-93vh) translateX(-10px) scale(1); }
  96% { opacity: 0; transform: translateY(-98vh) translateX(-15px) scale(0.6); }
  100% { opacity: 1; transform: translateY(-105vh) translateX(-20px) scale(1); }
}

@keyframes fragmentBurstLeft4 {
  0%, 92% { opacity: 0; transform: translateY(100vh) translateX(0) scale(0); }
  93% { opacity: 0; transform: translateY(-93vh) translateX(15px) scale(1); }
  96% { opacity: 0; transform: translateY(-98vh) translateX(25px) scale(0.5); }
  100% { opacity: 1; transform: translateY(-105vh) translateX(35px) scale(1); }
}

/* Fragment burst animations for right bubbles */
@keyframes fragmentBurstRight1 {
  0%, 92% { opacity: 0; transform: translateY(100vh) translateX(0) scale(0); }
  93% { opacity: 0; transform: translateY(-93vh) translateX(-20px) scale(1); }
  96% { opacity: 0; transform: translateY(-96vh) translateX(-35px) scale(0.8); }
  100% { opacity: 1; transform: translateY(-100vh) translateX(-50px) scale(1); }
}

@keyframes fragmentBurstRight2 {
  0%, 92% { opacity: 0; transform: translateY(100vh) translateX(0) scale(0); }
  93% { opacity: 0; transform: translateY(-93vh) translateX(20px) scale(1); }
  96% { opacity: 0; transform: translateY(-96vh) translateX(40px) scale(0.7); }
  100% { opacity: 1; transform: translateY(-100vh) translateX(60px) scale(1); }
}

@keyframes fragmentBurstRight3 {
  0%, 92% { opacity: 0; transform: translateY(100vh) translateX(0) scale(0); }
  93% { opacity: 0; transform: translateY(-93vh) translateX(-10px) scale(1); }
  96% { opacity: 0; transform: translateY(-98vh) translateX(-15px) scale(0.6); }
  100% { opacity: 1; transform: translateY(-105vh) translateX(-20px) scale(1); }
}

@keyframes fragmentBurstRight4 {
  0%, 92% { opacity: 0; transform: translateY(100vh) translateX(0) scale(0); }
  93% { opacity: 0; transform: translateY(-93vh) translateX(15px) scale(1); }
  96% { opacity: 0; transform: translateY(-98vh) translateX(25px) scale(0.5); }
  100% { opacity: 1; transform: translateY(-105vh) translateX(35px) scale(1); }
}


          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes bounce {
            0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
            40%, 43% { transform: translate3d(0,-30px,0); }
            70% { transform: translate3d(0,-15px,0); }
            90% { transform: translate3d(0,-4px,0); }
          }
        `}
      </style>
    </div>
  );
};

export default MoodSelectedScreen;