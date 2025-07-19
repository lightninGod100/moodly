import type { UserState, UserAction } from './types';

export const userReducer = (state: UserState | null, action: UserAction): UserState | null => {
  switch (action.type) {
    case 'SET_USER':
      return action.payload;
      
    case 'UPDATE_COUNTRY':
      if (!state) return null;
      return {
        ...state,
        country: action.payload.country,
        lastCountryChangeAt: action.payload.lastCountryChangeAt,
        canChangeCountry: false,
        // Calculate next change date (30 days from now)
        nextCountryChangeDate: new Date(action.payload.lastCountryChangeAt + (30 * 24 * 60 * 60 * 1000)).toISOString()
      };
      
    case 'UPDATE_PROFILE_PHOTO':
      if (!state) return null;
      return {
        ...state,
        profilePhoto: action.payload.profilePhoto
      };
      
    case 'UPDATE_PASSWORD':
      // Password change doesn't affect displayed user data
      return state;
      
    case 'MARK_FOR_DELETION':
      if (!state) return null;
      return {
        ...state,
        markForDeletion: action.payload.markForDeletion
      };
      
    case 'CLEAR_USER':
      return null;
      
    default:
      return state;
  }
};