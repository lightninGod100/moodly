// src/components/SignUpPage.tsx
import React, { useState } from 'react';

interface SignUpPageProps {
  onNavigate: (page: string) => void;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    country: ''
  });

  //for inputs blocking
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // List of countries for dropdown
  const countries = [
    'Select a country',
    'United States',
    'Canada',
    'United Kingdom',
    'Germany',
    'France',
    'Spain',
    'Italy',
    'Netherlands',
    'Sweden',
    'Norway',
    'Australia',
    'New Zealand',
    'Japan',
    'South Korea',
    'Singapore',
    'India',
    'China',
    'Brazil',
    'Mexico',
    'Argentina',
    'South Africa',
    'Egypt',
    'Nigeria',
    'Other'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
  
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          email: formData.email, 
          password: formData.password,
          country: formData.country
        })
      });
  
      const data = await response.json();
  
      if (response.ok) {
        console.log('Registration successful:', data);
        
        // Store JWT token (auto-login after signup)
        localStorage.setItem('authToken', data.token);
        
        // Store user data
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        // Navigate directly to dashboard
        onNavigate('home');
        window.location.reload();
        
      } else {
        setError(data.error || 'Registration failed. Please try again.');
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">Sign Up</h1>
      <p className="text-lg mb-8">You're one step away!</p>
      
      {error && (
      <div className="max-w-md mx-auto mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
      {error}
      </div>
      )}

      <form className="max-w-md mx-auto" onSubmit={handleSubmit}>
        <div className="mb-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            className="w-full px-4 py-3 border border-gray-300 rounded-full"
          />
        </div>
        
        <div className="mb-4">
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            className="w-full px-4 py-3 border border-gray-300 rounded-full"
          />
        </div>
        
        <div className="mb-6">
          <select
            name="country"
            value={formData.country}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-full"
          >
            {countries.map((country, index) => (
              <option 
                key={index} 
                value={index === 0 ? '' : country}
                disabled={index === 0}
              >
                {country}
              </option>
            ))}
          </select>
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-blue-500 text-white rounded-full text-lg font-medium"
        >
          {isLoading ? 'Signing up...' : 'Submit'}
        </button>
      </form>
      <p className="mt-6 text-gray-600">
        Already have an account?{' '}
        <button 
          onClick={() => onNavigate('login')}
          className="text-blue-500 hover:underline"
          disabled={isLoading}
        >
          Log in
        </button>
      </p>
     
     
    </div>
  );
};

export default SignUpPage;