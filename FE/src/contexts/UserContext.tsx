import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { UserContextType } from './types';
import { userReducer } from './userReducer';

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component props
interface UserProviderProps {
  children: ReactNode;
}
// interface LoginCredentials {
//   username: string;
//   password: string;
// }

// Provider component
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, dispatch] = useReducer(userReducer, null);
  //const [isAuthenticated, setIsAuthenticated] = useState(false);

  // const login = async (credentials: LoginCredentials) => {
  //   const response = await authApiService.login(credentials);
  //   dispatch(response.user);
  //   setIsAuthenticated(true);
  //   return response;
  // };
  
  const contextValue: UserContextType = {
    user,
    dispatch,
    isLoading: false,
    error: null
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the context
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};