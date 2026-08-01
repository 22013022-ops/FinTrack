import { useContext } from 'react';
import { AuthContext } from '../context/authStore';

// Provides consuming components access to the authenticated session state.
export const useAuth = () => useContext(AuthContext);
