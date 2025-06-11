/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      // Only Your Custom Colors
      colors: {
        pcolor: {
          0: '#a3c1ff',    // Light blue
          200: '#3264ff',  // YOUR MAIN BLUE
          300: '#2854e6',  // Darker blue
        },
        
        ncolor: {
          0: '#ffffff',    // Pure white
          10: '#e5e7eb',   // Light gray
          300: '#9ca3af',  // Medium gray
        },
      },

      // Only Font Family
      fontFamily: {
        sans: ['Poppins', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}