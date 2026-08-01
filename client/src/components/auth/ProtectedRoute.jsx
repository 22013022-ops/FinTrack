import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

// Protects application routes until a stored JWT has been validated by the API.
export default function ProtectedRoute() { const { user, isLoading } = useAuth(); if (isLoading) return null; return user ? <Outlet /> : <Navigate to="/login" replace />; }
