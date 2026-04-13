import { Moon, SunMedium } from 'lucide-react';
import useTheme from '../../hooks/useTheme';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="secondary-button rounded-xl px-3 py-2"
      aria-label="Toggle theme"
      type="button"
    >
      {theme === 'light' ? <Moon size={16} /> : <SunMedium size={16} />}
    </button>
  );
}

export default ThemeToggle;
