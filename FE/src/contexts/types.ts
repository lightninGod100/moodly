// User state interface
export interface UserState {
    id: number;
    username: string;
    email: string;
    country: string;
    gender: string;
    profilePhoto: string | null;
    lastCountryChangeAt: number | null;
    canChangeCountry: boolean;
    nextCountryChangeDate: string | null;
    markForDeletion: boolean;
  }
  
  // Action types for reducer
  export type UserAction = 
    | { type: 'SET_USER'; payload: UserState }
    | { type: 'UPDATE_COUNTRY'; payload: { country: string; lastCountryChangeAt: number } }
    | { type: 'UPDATE_PROFILE_PHOTO'; payload: { profilePhoto: string | null } }
    | { type: 'UPDATE_PASSWORD'; payload: {} } // No state change needed for password
    | { type: 'MARK_FOR_DELETION'; payload: { markForDeletion: boolean } }
    | { type: 'CLEAR_USER' };
  
  // Context interface
  export interface UserContextType {
    user: UserState | null;
    dispatch: React.Dispatch<UserAction>;
    isLoading: boolean;
    error: string | null;
  }