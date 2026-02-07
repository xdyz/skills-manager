import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // 从 localStorage 读取保存的主题
    return (localStorage.getItem('theme') as Theme) || 'system';
  });

  useEffect(() => {
    const applyTheme = (mode: 'light' | 'dark') => {
      const body = document.body;
      if (mode === 'dark') {
        body.setAttribute('theme-mode', 'dark');
      } else {
        body.removeAttribute('theme-mode');
      }
    };

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        applyTheme(mediaQuery.matches ? 'dark' : 'light');
      }
    };

    // 应用主题
    if (theme === 'system') {
      applyTheme(mediaQuery.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      applyTheme(theme);
    }

    // 保存到 localStorage
    localStorage.setItem('theme', theme);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme]);

  return { theme, setTheme };
}
