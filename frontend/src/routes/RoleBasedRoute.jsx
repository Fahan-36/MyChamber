import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

function RoleBasedRoute({ allowedRoles = [] }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const landingPath = user.role === 'admin' ? '/admin' : user.role === 'doctor' ? '/doctor' : '/patient';
    return <Navigate to={landingPath} replace />;
  }

  return <Outlet />;
}

export default RoleBasedRoute;
