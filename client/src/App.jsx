import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import AppLayout from './layouts/AppLayout';
import PlaceholderPage from './pages/PlaceholderPage';
import IncomePage from './pages/IncomePage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';

function AppRoutes() {
  const { user } = useAuth();
  return <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={user ? <Navigate to="/app/income" replace /> : <AuthPage mode="login" />} />
    <Route path="/signup" element={user ? <Navigate to="/app/income" replace /> : <AuthPage mode="signup" />} />
    <Route element={<ProtectedRoute />}><Route path="/app" element={<AppLayout />}><Route index element={<Navigate to="income" replace />} /><Route path="income" element={<IncomePage />} /><Route path=":section" element={<PlaceholderPage />} /></Route></Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}

export default function App() { return <AuthProvider><BrowserRouter><AppRoutes /></BrowserRouter></AuthProvider>; }
