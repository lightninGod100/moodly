// FE/src/constants/routes.ts

/**
 * Centralized route paths for the application
 * Using constants prevents typos and makes route changes easier
 */
export const ROUTES = {
    // Public routes
    LANDING: '/',
    LOGIN: '/login',
    SIGNUP: '/signup',
    PRIVACY: '/privacy-and-terms',
    
    // Protected routes (requires authentication)
    MOOD: '/mood',           // Main mood selector/selected screen
    DASHBOARD: '/dashboard', // User mood statistics
    GLOBE: '/globe',         // Global mood statistics
    SETTINGS: '/settings',   // User settings
  } as const;
  
  // Type for route paths (for TypeScript type safety)
  export type RoutePath = typeof ROUTES[keyof typeof ROUTES];