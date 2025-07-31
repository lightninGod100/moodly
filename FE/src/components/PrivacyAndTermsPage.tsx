// src/components/PrivacyAndTermsPage.tsx
import React, { useEffect } from 'react'; // Add useEffect to existing import
interface PrivacyAndTermsPageProps {
  onNavigate: (page: string) => void;
}

const isAuth = !!localStorage.getItem('authToken');

const PrivacyAndTermsPage: React.FC<PrivacyAndTermsPageProps> = ({ onNavigate }) => {
  useEffect(() => {
    document.body.classList.add('privacy-page');
    return () => {
      document.body.classList.remove('privacy-page');
    };
  }, []);
  const handleBackToHome = () => {
    onNavigate(isAuth ? 'home' : 'landing');
  };
  return (
    <div style={{ backgroundColor: !isAuth? 'rgb(240,240,240)':'rgba(10,10,10,0.9)', minHeight: '100vh', color: 'black', paddingTop:isAuth ? '3rem':'0' }}>
      {/* Content Container */}
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '3rem 2rem 3rem', // Top padding accounts for fixed navbar
        lineHeight: '1.6'
      }}>
        
        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ color: isAuth? 'white':'black',fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Privacy Policy & Terms of Service
          </h1>
          <p style={{ fontSize: '1.125rem', color: isAuth?'rgba(255,255,255,0.8)':'#6b7280' }}>
            Last updated: January 2025
          </p>
        </div>

        {/* Quick Navigation */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '3rem',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <a 
            href="#privacy" 
            style={{ 
              color: '#3b82f6', 
              textDecoration: 'none', 
              fontWeight: '500',
              marginRight: '2rem'
            }}
          >
            Privacy Policy
          </a>
          <a 
            href="#terms" 
            style={{ 
              color: '#3b82f6', 
              textDecoration: 'none', 
              fontWeight: '500' 
            }}
          >
            Terms of Service
          </a>
        </div>

        {/* Privacy Policy Section */}
        <section id="privacy" style={{ marginBottom: '4rem' }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '2rem', 
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', color: '#1f2937' }}>
              Privacy Policy
            </h2>

            {/* Data Collection */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                What Information We Collect
              </h3>
              <ol style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'decimal' }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Mood Data:</strong> Your daily mood selections and timestamps
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Account Information:</strong> Email address, username, country, and account creation date
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Usage Data:</strong> How you interact with our features and when you use the service
                </li>
              </ol>
            </div>

            {/* Data Usage */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                How We Use Your Information
              </h3>
              <ol style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'decimal' }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Personal Features:</strong> Display your mood statistics, trends, and personalized dashboard
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Global Statistics:</strong> Your mood data contributes to anonymous global mood maps and statistics
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>AI Insights:</strong> Your mood data may be processed by AI services (such as ChatGPT) to generate personalized insights and recommendations
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Service Improvement:</strong> Understanding usage patterns to improve our features
                </li>
              </ol>
            </div>

            {/* Data Sharing */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                How We Share Your Information
              </h3>
              <ol style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'decimal' }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>We Never Sell Your Data:</strong> Your personal information is never sold to third parties
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>AI Processing:</strong> Mood data may be sent to AI services for insights, but personal identifiers are removed
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Anonymous Aggregation:</strong> Your mood data contributes to global statistics but cannot be traced back to you
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Legal Requirements:</strong> We may disclose information when legally required to do so
                </li>
              </ol>
            </div>

            {/* Data Security */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                Data Security
              </h3>
              <p style={{ marginBottom: '1rem' }}>
                We implement appropriate security measures to protect your personal information:
              </p>
              <ol style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'decimal' }}>
                <li style={{ marginBottom: '0.5rem' }}>Encrypted data transmission (HTTPS)</li>
                <li style={{ marginBottom: '0.5rem' }}>Secure database storage with access controls</li>
                <li style={{ marginBottom: '0.5rem' }}>JWT token-based authentication</li>
                <li style={{ marginBottom: '0.5rem' }}>Regular security updates and monitoring</li>
              </ol>
            </div>

            {/* User Rights */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                Your Rights
              </h3>
              <p style={{ marginBottom: '1rem' }}>You have the right to:</p>
              <ol style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'decimal' }}>
                <li style={{ marginBottom: '0.5rem' }}>Access your personal data and mood history</li>
                <li style={{ marginBottom: '0.5rem' }}>Delete your account and all associated data</li>
                <li style={{ marginBottom: '0.5rem' }}>Export your mood data</li>
                <li style={{ marginBottom: '0.5rem' }}>Opt-out of AI insights processing</li>
                <li style={{ marginBottom: '0.5rem' }}>Contact us with privacy-related questions</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Terms of Service Section */}
        <section id="terms">
          <div style={{ 
            backgroundColor: 'white', 
            padding: '2rem', 
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', color: '#1f2937' }}>
              Terms of Service
            </h2>

            {/* Service Description */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                Service Description
              </h3>
              <p style={{ marginBottom: '1rem' }}>
                Moodly is a mood tracking application that allows you to:
              </p>
              <ol style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'decimal' }}>
                <li style={{ marginBottom: '0.5rem' }}>Track your daily moods and emotions</li>
                <li style={{ marginBottom: '0.5rem' }}>View personal mood statistics and trends</li>
                <li style={{ marginBottom: '0.5rem' }}>Access global mood statistics and visualizations</li>
                <li style={{ marginBottom: '0.5rem' }}>Receive AI-generated insights about your mood patterns</li>
              </ol>
            </div>

            {/* Medical Disclaimer */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                Medical Disclaimer
              </h3>
              <div style={{ 
                backgroundColor: '#fef3c7', 
                padding: '1rem', 
                borderRadius: '6px', 
                border: '1px solid #f59e0b',
                marginBottom: '1rem'
              }}>
                <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Important:</p>
                <p>
                  Moodly is NOT a medical device or therapeutic service. It is designed for personal wellness tracking only. 
                  Our service is not intended to diagnose, treat, cure, or prevent any medical condition.
                </p>
              </div>
              <p style={{ marginBottom: '1rem' }}>
                If you are experiencing mental health issues, please consult with qualified healthcare professionals. 
                Do not rely solely on mood tracking data for medical decisions.
              </p>
            </div>

            {/* User Responsibilities */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                User Responsibilities
              </h3>
              <p style={{ marginBottom: '1rem' }}>By using Moodly, you agree to:</p>
              <ol style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'decimal' }}>
                <li style={{ marginBottom: '0.5rem' }}>Provide accurate information when creating your account</li>
                <li style={{ marginBottom: '0.5rem' }}>Use the service in a responsible and appropriate manner</li>
                <li style={{ marginBottom: '0.5rem' }}>Not share your account credentials with others</li>
                <li style={{ marginBottom: '0.5rem' }}>Not attempt to access other users' data</li>
                <li style={{ marginBottom: '0.5rem' }}>Report any bugs or security issues you discover</li>
              </ol>
            </div>

            {/* Prohibited Uses */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                Prohibited Uses
              </h3>
              <p style={{ marginBottom: '1rem' }}>You may not use Moodly to:</p>
              <ol style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'decimal' }}>
                <li style={{ marginBottom: '0.5rem' }}>Create fake accounts or provide false information</li>
                <li style={{ marginBottom: '0.5rem' }}>Attempt to reverse engineer or hack our systems</li>
                <li style={{ marginBottom: '0.5rem' }}>Use the service for any illegal or harmful purposes</li>
                <li style={{ marginBottom: '0.5rem' }}>Interfere with other users' experience</li>
                <li style={{ marginBottom: '0.5rem' }}>Violate others' privacy or rights</li>
              </ol>
            </div>

            {/* Account Management */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                Account Management
              </h3>
              <ol style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'decimal' }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Account Creation:</strong> You must provide a valid email address and choose a secure password
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Account Termination:</strong> You may delete your account at any time through the contact form
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Data Retention:</strong> After account deletion, your data will be permanently removed within 30 days
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Service Availability:</strong> We strive for 99% uptime but cannot guarantee uninterrupted service
                </li>
              </ol>
            </div>

            {/* Contact Information */}
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                Contact Us
              </h3>
              <p style={{ marginBottom: '1rem' }}>
                If you have any questions about this Privacy Policy or Terms of Service, please contact us using the 
                Contact Us form in the website footer.
              </p>
            </div>
          </div>
        </section>

        {/* Back to Home and Back to Top Buttons */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '1rem', 
          marginTop: '3rem' 
        }}>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '0.75rem 2rem',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            Back to Top
          </button>
          <button
            onClick={() => handleBackToHome()}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '0.75rem 2rem',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyAndTermsPage;