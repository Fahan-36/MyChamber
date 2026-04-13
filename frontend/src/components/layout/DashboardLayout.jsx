import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import useAuth from '../../hooks/useAuth';
import NotificationBell from '../dashboard/NotificationBell';
import ProfileDropdown from '../dashboard/ProfileDropdown';
import AdminSidebar from '../admin/AdminSidebar';

function DashboardLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto flex max-w-7xl gap-4 px-4 py-5">
        {user?.role === 'admin' ? <AdminSidebar /> : <Sidebar role={user?.role} />}
        <div className="w-full">
          <div className="mb-4 flex items-center justify-end gap-2">
            <NotificationBell />
            <ProfileDropdown />
          </div>
          <Outlet />
          <div className="h-10 md:h-0" />
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
