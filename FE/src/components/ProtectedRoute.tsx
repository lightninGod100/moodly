// FE/src/components/ProtectedRoute.tsx

import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  isLoading?: boolean;
}

/**
 * Route guard component that protects authenticated routes
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute = ({ isAuthenticated, isLoading = false }: ProtectedRouteProps) => {
  // Optional: Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // Render child routes if authenticated
  return <Outlet />;
};

export default ProtectedRoute;