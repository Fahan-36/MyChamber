import { LogOut, UserCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="secondary-button rounded-xl px-3 py-2"
      >
        <UserCircle2 size={18} />
        <span className="hidden sm:inline">{user?.name?.split(' ')[0] || 'Profile'}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-soft dark:border-slate-700 dark:bg-slate-900">
          <Link
            to="/profile"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => setOpen(false)}
          >
            <UserCircle2 size={16} /> View Profile
          </Link>
          <button
            type="button"
            onClick={logout}
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileDropdown;
