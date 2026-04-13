import { Menu, Stethoscope, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import ThemeToggle from '../ui/ThemeToggle';

const links = [
  { id: 'home', label: 'Home', type: 'anchor' },
  { id: 'doctors', label: 'Doctors', type: 'route', to: '/doctors' },
  { id: 'features', label: 'Features', type: 'anchor' },
  { id: 'about', label: 'About', type: 'anchor' },
  { id: 'faq', label: 'FAQ', type: 'anchor' },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const [activeHash, setActiveHash] = useState('home');
  const { isAuthenticated, user } = useAuth();
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();
  const transparent = pathname === '/';

  const dashboardPath = user?.role === 'doctor' ? '/doctor' : '/patient';

  useEffect(() => {
    if (pathname !== '/') {
      return;
    }

    setActiveHash(hash ? hash.replace('#', '') : 'home');
  }, [pathname, hash]);

  const handleAnchorClick = (id) => (event) => {
    event.preventDefault();
    setOpen(false);
    setActiveHash(id);

    if (pathname !== '/') {
      navigate(`/#${id}`);
      return;
    }

    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(null, '', `/#${id}`);
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 border-b transition ${
        transparent
          ? 'border-transparent bg-white/40 backdrop-blur-xl dark:bg-slate-950/40'
          : 'border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5 font-display text-xl font-bold text-slate-900 dark:text-slate-50">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-500/30">
            <Stethoscope size={18} />
          </span>
          MyChamber
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => {
            const isAnchorActive = pathname === '/' && activeHash === link.id;
            const isRouteActive = link.type === 'route' && pathname === link.to;
            const className = `text-sm font-medium transition ${
              isAnchorActive || isRouteActive
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`;

            if (link.type === 'route') {
              return (
                <Link key={link.id} to={link.to} className={className}>
                  {link.label}
                </Link>
              );
            }

            return (
              <a key={link.id} href={`/#${link.id}`} onClick={handleAnchorClick(link.id)} className={className}>
                {link.label}
              </a>
            );
          })}
        </div>

        <div className="hidden items-center gap-2.5 md:flex">
          <ThemeToggle />
          {isAuthenticated ? (
            <Link
              to={dashboardPath}
              className="inline-flex items-center rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center rounded-full border border-teal-300 bg-white/80 px-4 py-2 text-sm font-semibold text-teal-700 transition hover:border-teal-400 hover:bg-teal-50 dark:border-teal-700 dark:bg-transparent dark:text-teal-400 dark:hover:bg-teal-900/20"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center rounded-full bg-gradient-to-br from-teal-500 via-brand-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-teal-500/30 transition hover:shadow-teal-500/50 hover:brightness-105 active:scale-[0.98]"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-xl border border-slate-200 p-2 md:hidden dark:border-slate-700"
          type="button"
          aria-label="Toggle menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {open && (
        <div className="mx-4 mb-4 space-y-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-soft md:hidden dark:border-slate-700 dark:bg-slate-900">
          {links.map((link) => {
            const isAnchorActive = pathname === '/' && activeHash === link.id;
            const isRouteActive = link.type === 'route' && pathname === link.to;
            const className = `block rounded-xl px-3 py-2 text-sm transition ${
              isAnchorActive || isRouteActive
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`;

            if (link.type === 'route') {
              return (
                <Link key={link.id} to={link.to} onClick={() => setOpen(false)} className={className}>
                  {link.label}
                </Link>
              );
            }

            return (
              <a key={link.id} href={`/#${link.id}`} onClick={handleAnchorClick(link.id)} className={className}>
                {link.label}
              </a>
            );
          })}
          {isAuthenticated ? (
            <Link to={dashboardPath} className="primary-button w-full" onClick={() => setOpen(false)}>
              Dashboard
            </Link>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link to="/login" className="secondary-button w-full" onClick={() => setOpen(false)}>
                Login
              </Link>
              <Link to="/register" className="primary-button w-full" onClick={() => setOpen(false)}>
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export default Navbar;
