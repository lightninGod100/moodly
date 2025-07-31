import React, { useState, useEffect } from 'react';

interface PublicNavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

const PublicNavbar: React.FC<PublicNavbarProps> = ({ onNavigate, currentPage }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrollingUp, setIsScrollingUp] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Check if scrolled past 30% of viewport (existing logic)
      const scrolled = currentScrollY > windowHeight * 0.2;
      
      // Check if near bottom (90% of page)
      const scrollPercent = (currentScrollY + windowHeight) / documentHeight;
      const nearBottom = scrollPercent >= 0.97;
      
      // Check scroll direction
      const scrollingUp = currentScrollY < lastScrollY;
      
      setIsScrolled(scrolled);
      setIsNearBottom(nearBottom);
      setIsScrollingUp(scrollingUp);
      setLastScrollY(currentScrollY);
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
      if (!isScrolled) {
        return 'navbar-landing-transparent';
      }
      // If near bottom and scrolling down, hide navbar
      if (isNearBottom && !isScrollingUp) {
        return 'navbar-landing-scrolled-centered-hidden';
      }
      // Otherwise show centered navbar
      return 'navbar-landing-scrolled-centered navbar-auth  navbar-landing-page';
    }
    if (currentPage === 'globe') {
      return 'navbar-auth navbar-auth-globe ';
    }
    if (currentPage === 'privacy-and-terms') {
      return 'navbar-privacy-centered-static navbar-landing-scrolled-centered';
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