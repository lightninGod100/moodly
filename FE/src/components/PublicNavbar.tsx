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
      const scrolled = window.scrollY > window.innerHeight * 0.3;
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
  const getNavbarPageClass = () => {
    if (currentPage === 'landing') {
      return isScrolled ? 'navbar-landing-scrolled-centered' : 'navbar-landing-transparent';
    }
    if (currentPage === 'globe') {
      return 'navbar-globe';
    }
    if (currentPage === 'privacy-and-terms') {
      return 'navbar-privacy-terms';
    }
    return 'navbar-default';
  };

  return (
    <>
      <nav className={`navbar-base ${getNavbarPageClass()}`}>
        <div className="text-2xl font-bold">
          <button
            onClick={() => onNavigate('landing')}>
            mOOdly
          </button>
        </div>

        <div className="navbar-menu">
          <button
            className={`navbar-button ${currentPage === 'globe' ? 'navbar-button-active' : ''}`}
            onClick={() => onNavigate('globe')}
          >
            Globe
          </button>
          <button
            className="navbar-button"
            onClick={() => onNavigate('signup')}
          >
            Signup
          </button>
          <button
            className="navbar-button"
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