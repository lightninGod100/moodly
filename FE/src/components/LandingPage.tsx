 
// src/components/LandingPage.tsx
import React from 'react';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-6">Moodly</h1>
      <h2 className="text-2xl mb-8">
        helps you track your daily mood
        <br />
        and behavior—one vibe at a time
      </h2>
      <p className="text-lg mb-8">
        Create your personal mood record and see how
        <br />
        you felt every day of the year
      </p>
      <button 
        className="px-8 py-3 border-2 border-black text-lg"
        onClick={() => onNavigate('signup')}
      >
        TRY NOW
      </button>
    </div>
  );
};

export default LandingPage;