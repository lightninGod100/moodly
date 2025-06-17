import React, { useState, useEffect } from 'react';

interface PublicNavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

const PublicNavbar: React.FC<PublicNavbarProps> = ({ onNavigate, currentPage }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Check if we've scrolled past the hero section (adjust threshold as needed)
      const scrolled = window.scrollY > window.innerHeight *0.3;
      setIsScrolled(scrolled);
    };

    // Only add scroll listener on landing page
    if (currentPage === 'landing') {
      window.addEventListener('scroll', handleScroll);
      handleScroll(); // Check initial scroll position
    } else {
      setIsScrolled(true); // Always show white bg on other pages
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [currentPage]);

  return (
    <>
      <nav className={`w-full py-3 px-6 flex justify-between items-center fixed top-0 z-10 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white' 
          : 'bg-transparent text-black'
      }`}>
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
    </>
  );
};

export default PublicNavbar;