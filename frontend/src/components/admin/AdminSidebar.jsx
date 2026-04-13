import {
  LayoutDashboard,
  Stethoscope,
  Users,
  CalendarClock,
  Star,
  LogOut,
  Activity,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

function AdminSidebar() {
  const { logout } = useAuth();

  const links = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
    { to: '/admin/patients', label: 'Patients', icon: Users },
    { to: '/admin/appointments', label: 'Appointments', icon: CalendarClock },
    { to: '/admin/reviews', label: 'Reviews', icon: Star },
  ];

  return (
    <aside className="glass-card sticky top-20 hidden h-[calc(100vh-6rem)] w-64 rounded-3xl p-4 lg:block">
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-brand-500 to-teal-500 p-4 text-white">
        <p className="text-xs uppercase tracking-wide text-white/80">MyChamber</p>
        <p className="mt-1 font-display text-lg font-semibold">Admin Panel</p>
      </div>

      <div className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              <Icon size={16} />
              {link.label}
            </NavLink>
          );
        })}

        <button
          type="button"
          onClick={logout}
          className="mt-2 flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      <div className="mt-auto rounded-2xl bg-slate-100/70 p-3 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-300">
        <Activity className="mb-2" size={14} />
        Monitor platform health and keep provider quality standards consistent.
      </div>
    </aside>
  );
}

export default AdminSidebar;
