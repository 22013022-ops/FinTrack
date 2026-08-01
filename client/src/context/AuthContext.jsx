import { useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { AuthContext } from './authStore';
const TOKEN_KEY = 'fintrack_token';

// Owns session restoration, token persistence, logout, and authentication state.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); const [isLoading, setIsLoading] = useState(true);
  useEffect(() => { const restore = async () => { if (!localStorage.getItem(TOKEN_KEY)) { setIsLoading(false); return; } try { const { data } = await authService.getMe(); setUser(data.user); } catch { localStorage.removeItem(TOKEN_KEY); } finally { setIsLoading(false); } }; restore(); }, []);
  const save = ({ token, user: nextUser }) => { localStorage.setItem(TOKEN_KEY, token); setUser(nextUser); };
  const value = useMemo(() => ({ user, isLoading, login: async (details) => { const { data } = await authService.login(details); save(data); }, signup: async (details) => { const { data } = await authService.signup(details); save(data); }, logout: () => { localStorage.removeItem(TOKEN_KEY); setUser(null); } }), [user, isLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
