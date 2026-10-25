import { useEffect, useState } from 'react';
import MedicalIcon from './MedicalIcon';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem('tm_theme') || 'light');
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('tm_theme', theme); }, [theme]);
  return (
    <button className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle light / dark theme" title="Light / dark">
      <MedicalIcon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  );
}
