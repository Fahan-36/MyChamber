import {
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  Search,
  User,
  Clock3,
  Activity,
  History,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

function Sidebar({ role = 'patient' }) {
  const patientLinks = [
    { to: '/patient', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/doctors', label: 'Find Doctors', icon: Search },
    { to: '/patient/appointments', label: 'Appointments', icon: CalendarClock },
    { to: '/patient/history', label: 'My History', icon: History },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  const doctorLinks = [
    { to: '/doctor', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/doctor/schedule', label: 'Schedule', icon: Clock3 },
    { to: '/doctor/appointments', label: 'Appointments', icon: ClipboardList },
    { to: '/doctor/patient-history', label: 'Patient History', icon: History },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  const links = role === 'doctor' ? doctorLinks : patientLinks;

  return (
    <aside className="glass-card sticky top-20 hidden h-[calc(100vh-6rem)] w-64 rounded-3xl p-4 lg:block">
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-brand-500 to-teal-500 p-4 text-white">
        <p className="text-xs uppercase tracking-wide text-white/80">MyChamber</p>
        <p className="mt-1 font-display text-lg font-semibold">{role === 'doctor' ? 'Doctor Panel' : 'Patient Portal'}</p>
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
      </div>

      <div className="mt-auto rounded-2xl bg-slate-100/70 p-3 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-300">
        <Activity className="mb-2" size={14} />
        Keep your workflow synced with real-time statuses and slot updates.
      </div>
    </aside>
  );
}

export default Sidebar;
