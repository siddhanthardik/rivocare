import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from '../ui/Feedback';

// Redirect authenticated users away from guest-only pages
export function GuestRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (user) {
    const paths = { patient: '/dashboard/patient', provider: '/dashboard/provider', admin: '/dashboard/admin', partner: '/dashboard/partner/lab' };
    return <Navigate to={paths[user.role] || '/'} replace />;
  }
  return <Outlet />;
}

// Protect routes — require login + optional role check
export function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!user) {
    const isPartnerPath = location.pathname.startsWith('/dashboard/partner');
    const loginPath = isPartnerPath ? '/partner/lab/login' : '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }
  if (role && user.role !== role) {
    const paths = { patient: '/dashboard/patient', provider: '/dashboard/provider', admin: '/dashboard/admin', partner: '/dashboard/partner/lab' };
    return <Navigate to={paths[user.role] || '/'} replace />;
  }
  return <Outlet />;
}
