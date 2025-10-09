// src/components/ErrorScreen.tsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import WAVES from 'vanta/dist/vanta.waves.min';

interface ErrorScreenProps {
  title?: string;
  message?: string;
  emoji?: string;
  showMoodBox?: boolean;
  onRetry?: () => void;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({ 
  title = "We're Feeling Tired Right Now",
  message = "Our servers need a little rest.\nPlease try refreshing or come back later.",
  emoji = "😴"
}) => {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);

  // Tired mood color from MoodSelectedScreen (hex to Vanta number format)
  const tiredColor = 0x2B373F; // #2B373F converted to hex number

  // Initialize Vanta effect (exact same setup as MoodSelectedScreen)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (!vantaEffect.current && vantaRef.current) {
          console.log('Initializing Vanta Waves for ErrorScreen...');

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
            color: tiredColor,
            shininess: 50,
            waveHeight: 20,
            waveSpeed: 1.2,
            zoom: 0.75
          });

          console.log('Vanta effect created for ErrorScreen');
          
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

  return (
    <div ref={vantaRef} style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      
      {/* Main Content - Same positioning structure as MoodSelectedScreen */}
      <div style={{
        position: 'absolute',
        top: '15vh',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 5,
        color: 'white',
        width: '85%',
        maxWidth: '1050px',
        textAlign: 'center'
      }}>

        {/* Hero Section */}
        <div style={{ marginBottom: '1rem', paddingTop: '4.75rem' }}>
          
          {/* Main Error Emoji with Animation */}
          <div style={{ 
            fontSize: '6rem', 
            marginBottom: '1.5rem',
            animation: 'bounce 2s infinite'
          }}>
            {emoji}
          </div>
          
          {/* Error Title */}
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: 'bold', 
            marginBottom: '1rem',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
          }}>
            {title}
          </h1>
          
          {/* Error Message */}
          <p style={{ 
            fontSize: '1.25rem', 
            color: 'rgba(255, 255, 255, 0.9)', 
            marginBottom: '2rem',
            whiteSpace: 'pre-line',
            lineHeight: '1.6'
          }}>
            {message}
          </p>

        
        </div>

        

        {/* Additional Help Text */}
        <div style={{ 
          marginTop: '3rem', 
          fontSize: '0.875rem', 
          color: 'rgba(255, 255, 255, 0.6)',
          maxWidth: '600px',
          margin: '3rem auto 0'
        }}>
          <p style={{ marginBottom: '0.5rem' }}>
            🔧 <strong>What you can try:</strong>
          </p>
          <p style={{ lineHeight: '1.5' }}>
            Check your internet connection • Refresh the page • Try again in a few minutes
          </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0,0,0);
          }
          40%, 43% {
            transform: translate3d(0,-15px,0);
          }
          70% {
            transform: translate3d(0,-7px,0);
          }
          90% {
            transform: translate3d(0,-2px,0);
          }
        }
      `}</style>
    </div>
  );
};

export default ErrorScreen;