'use client';

import { Moon, Sun } from 'lucide-react';
import { useColorTheme } from './UIProvider';

export function ThemeToggle() {
  const { colorTheme, toggleColorTheme } = useColorTheme();
  const isDark = colorTheme === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleColorTheme}
      aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      aria-pressed={isDark}
      title={isDark ? 'Dùng giao diện sáng' : 'Dùng giao diện tối'}
    >
      {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
      <span>{isDark ? 'Sáng' : 'Tối'}</span>
    </button>
  );
}
