// src/components/PublicNavbar.tsx
import React from 'react';

interface PublicNavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

const PublicNavbar: React.FC<PublicNavbarProps> = ({ onNavigate, currentPage }) => {
  return (
    <>
      <nav className="w-full py-4 px-6 flex justify-between items-center fixed top-0 z-10 bg-white">
        <div className="text-2xl font-bold">mOOdly</div>
        <div className="flex gap-6">
          <button 
            className={`px-2 ${currentPage === 'globe' ? 'font-semibold' : ''}`}
            onClick={() => onNavigate('globe')}
          >
            Globe
          </button>
          <button 
            className={`px-2 ${currentPage === 'signup' ? 'font-semibold' : ''}`}
            onClick={() => onNavigate('signup')}
          >
            Signup
          </button>
          <button 
            className={`px-2 ${currentPage === 'login' ? 'font-semibold' : ''}`}
            onClick={() => onNavigate('login')}
          >
            Login
          </button>
        </div>
      </nav>
      <div className="w-full h-px bg-gray-300"></div>
    </>
  );
};

export default PublicNavbar; 
