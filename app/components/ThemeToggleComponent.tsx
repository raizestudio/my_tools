'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
    setMounted(true);
  }, []);

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextTheme = e.target.checked ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  if (!mounted) {
    return <div className="size-7" />;
  }

  return (
    <label className="swap swap-rotate cursor-pointer text-base-content">
      <input
        type="checkbox"
        onChange={handleToggle}
        checked={theme === 'dark'}
      />
      <span className="swap-on icon-[ri--moon-fill] size-6"></span>
      <span className="swap-off icon-[ri--sun-fill] size-6"></span>
    </label>
  );
}
