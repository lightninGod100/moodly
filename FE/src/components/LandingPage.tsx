// src/components/LandingPage.tsx
import React, { useState } from 'react';
import ContactPopup from './ContactPopup';
import SupportUsPopup from './SupportUsPopup';
import FAQPopup from './FAQPopup';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [showContactPopup, setShowContactPopup] = useState(false);

  const handleContactClick = () => {
    setShowContactPopup(true);
  };

  const handleContactClose = () => {
    setShowContactPopup(false);
  };

  const handleContactSubmit = async (reason: string, message: string, email?: string) => {
    try {
      // Prepare headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
  
      // Add authorization header if user is authenticated
      const authToken = localStorage.getItem('authToken');
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
  
      // Make API call to backend
      const response = await fetch('http://localhost:5000/api/contact/', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          reason,
          message,
          email
        })
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }
  
      console.log('✅ Message sent successfully:', data.message);
      console.log('📧 Submission ID:', data.submissionId);
  
    } catch (error) {
      console.error('❌ Error sending message:', error);
      alert(`Failed to send message: ${error instanceof Error ? error.message : 'Please try again later'}`);
      throw error;
    }
  };
  const [showSupportPopup, setShowSupportPopup] = useState(false);

  const handleSupportClick = () => {
    setShowSupportPopup(true);
  };

  const handleSupportClose = () => {
    setShowSupportPopup(false);
  };

  const handleSupportSignUp = () => {
    onNavigate('signup'); // Navigate to signup page
  };

  const [showFAQPopup, setShowFAQPopup] = useState(false);

  const handleFAQClick = () => {
    setShowFAQPopup(true);
  };

  const handleFAQClose = () => {
    setShowFAQPopup(false);
  };
  return (
    // {/* This div parent of all the sections */}
    <div className="text-center pt-200">

      <section className="hero_section">
        <h1 className="text-6xl font-bold mb-8 text-white" style={{
          color: 'white',
          textShadow: `
    -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black,
    -2px -2px 0 black, 2px -2px 0 black, -2px 2px 0 black, 2px 2px 0 black
  `
        }}>mOOdly</h1>

        <h2 className="text-4xl mb-8 text-white">
          helps you track your daily mood
          <br />
          and behavior—one vibe at a time
        </h2>

        <p className="text-2xl mb-8 text-white">
          Create your personal mood record and see how
          <br />
          you felt every day of the year
        </p>

        <button
          className="lp_get_started_button text-lg font-bold"
          onClick={() => onNavigate('signup')}
        >
          Get Started
        </button>
      </section>

      <section className="lp_sec2">
        <h2 className="text-5xl font-bold text-pcolor-200 mb-12">How it Works</h2>

        <div className="flex justify-center items-start gap-12 text-2xl">
          {/* Step 1 */}
          <div className="text-center max-w-xs">
            <div className="lp_sec2_1 mx-auto mb-4" />
            <p className="text-black">
              Select an emoji that represents your mood.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center max-w-xs">
            <div className="lp_sec2_3 mx-auto mb-4" />
            <p className="text-black">
              Gain insights on your emotional trends.
            </p>
          </div>
          {/* Step 3 */}
          <div className="text-center max-w-xs">
            <div className="lp_sec2_2 mx-auto mb-4" />
            <p className="text-black">
              See the mood of the people around the world.
            </p>
          </div>



        </div>
      </section>

      <section className="lp_sec3">
        <h2 className="text-4xl font-bold text-black mb-12 text-center">Why Mood Tracking Matters</h2>

        <div className="flex justify-center items-start gap-12">
          {/* Card 1 */}
          <div className="lp_sec3_card">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-4">Catch Emotional Patterns Early</h3>
            <p className="text-gray-600 italic">
              "People who track their moods regularly are up to <strong>30% more likely</strong> to notice early signs of stress, anxiety, or depression."
            </p>
            <p className="text-sm text-gray-500 mt-4">→ Source: Journal of Medical Internet Research (JMIR)</p>
          </div>

          {/* Card 2 */}
          <div className="lp_sec3_card">
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="text-xl font-bold mb-4">Don't Let Your Brain Trick You</h3>
            <p className="text-gray-600 italic">
              "We naturally forget up to <strong>50% of our positive days</strong>—mood tracking shows the full picture, not just what your mind remembers."
            </p>
            <p className="text-sm text-gray-500 mt-4">→ Source: Behavioral Psychology Studies</p>
          </div>

          {/* Card 3 */}
          <div className="lp_sec3_card">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold mb-4">Boost Your Mental Wellness</h3>
            <p className="text-gray-600 italic">
              "Daily mood tracking has been shown to improve self-awareness and emotional well-being by up to <strong>40%</strong> when paired with healthy habits."
            </p>
            <p className="text-sm text-gray-500 mt-4">→ Source: JMIR Mental Health</p>
          </div>
        </div>
      </section>
      <section className="lp_cta">
        <h2 className="text-4xl font-bold mb-8 text-center">
          Why Wait?<br /> Start Your Journey to Emotional Well-being Today!
        </h2>

        <div className="text-center">
          <button
            className="lp_cta_button text-xl font-semibold"
            onClick={() => onNavigate('signup')}
          >
            Sign Up for Free
          </button>
        </div>
      </section>
      <section className="lp_footer text-white">
        <div className="flex justify-between items-center">
          {/* Left side - Copyright */}
          <div>
            <p>© 2025 Moodly. All rights reserved.</p>
          </div>

          {/* Right side - Links */}
          <div className="flex gap-6  hover: font-semibold">
            <button
              onClick={handleContactClick}
              className="text-white hover:text-gray-300 bg-transparent border-none cursor-pointer"
            >
              Contact Us
            </button>
            <button
              onClick={() => onNavigate('privacy-and-terms')}
              className="text-white hover:text-gray-300 bg-transparent border-none cursor-pointer"
            >
              Privacy & Terms
            </button>
            <button
              onClick={handleFAQClick}
              className="text-white hover:text-gray-300 bg-transparent border-none cursor-pointer"
            >
              FAQs
            </button>
            <button
              onClick={handleSupportClick}
              className="text-white hover:text-gray-300  bg-transparent border-none cursor-pointer"
            >
              Support Us
            </button>
          </div>
        </div>
      </section>

      {/* Contact Popup */}
      <ContactPopup
        isOpen={showContactPopup}
        onClose={handleContactClose}
        onSubmit={handleContactSubmit}
      />
      {/* Add this before the closing </div> along with ContactPopup */}
      <SupportUsPopup
        isOpen={showSupportPopup}
        onClose={handleSupportClose}
        onSignUp={handleSupportSignUp}
      />
      <FAQPopup
        isOpen={showFAQPopup}
        onClose={handleFAQClose}
      />
    </div>

  );
};

export default LandingPage;