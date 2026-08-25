import { useEffect, useState } from 'react';

export function useTheme() {
  const [temaOscuro, setTemaOscuro] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', temaOscuro ? 'dark' : 'light');
    localStorage.setItem('theme', temaOscuro ? 'dark' : 'light');
  }, [temaOscuro]);

  const toggleTheme = () => setTemaOscuro((prev) => !prev);

  return { temaOscuro, toggleTheme };
}
