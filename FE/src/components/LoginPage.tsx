// src/components/LoginPage.tsx
import React, { useState } from 'react';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          email: formData.email, 
          password: formData.password 
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login successful:', data);
        
        // Store JWT token
        localStorage.setItem('authToken', data.token);
        
        // Store user data
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        // REMOVED: localStorage.setItem('userAuth', 'true'); 
        
        onNavigate('home');
        window.location.reload();
        
      } else {
        setError(data.error || 'Login failed. Please try again.');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">Log In</h1>
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
            className="w-full px-4 py-3 border border-gray-300 rounded-full disabled:opacity-50"
          />
        </div>
        
        <div className="mb-6">
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            className="w-full px-4 py-3 border border-gray-300 rounded-full disabled:opacity-50"
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-blue-500 text-white rounded-full text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600"
        >
          {isLoading ? 'Logging in...' : 'Submit'}
        </button>
      </form>
      
      <p className="mt-6 text-gray-600">
        Don't have an account?{' '}
        <button 
          onClick={() => onNavigate('signup')}
          className="text-blue-500 hover:underline"
          disabled={isLoading}
        >
          Sign up
        </button>
      </p>
    </div>
  );
};

export default LoginPage;