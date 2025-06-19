 // src/components/AuthenticatedNavbar.tsx
import React from 'react';

interface AuthNavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

const AuthenticatedNavbar: React.FC<AuthNavbarProps> = ({ onNavigate, currentPage }) => {
  return (
    <>
      <nav className="w-full py-3 px-6 flex justify-between items-center">
        <div className="text-2xl font-bold">Moodly</div>
        <div className="flex gap-6">
          <button 
            className={`px-2 ${currentPage === 'home' ? 'font-semibold' : ''}`}
            onClick={() => onNavigate('home')}
          >
            Home
          </button>
          <button 
            className={`px-2 ${currentPage === 'globe' ? 'font-semibold' : ''}`}
            onClick={() => onNavigate('globe')}
          >
            Globe
          </button>
          <button 
            className={`px-2 ${currentPage === 'you' ? 'font-semibold' : ''}`}
            onClick={() => onNavigate('you')}
          >
            You
          </button>
          <button 
            className={`px-2`}
            onClick={() => onNavigate('logout')}
          >
            Logout
          </button>
        </div>
      </nav>
      
    </>
  );
};

export default AuthenticatedNavbar;
