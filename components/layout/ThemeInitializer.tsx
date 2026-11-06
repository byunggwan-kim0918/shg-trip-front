'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/stores';

/** 루트 레이아웃에 한 번만 마운트한다. */
export default function ThemeInitializer() {
  const theme = useAppStore((s) => s.theme);
  const isInitialized = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    const stored = localStorage.getItem('theme');
    if (!stored) {
      // 저장된 테마가 없으면 시스템 설정을 따르고, 저장하지 않아야 이후 시스템 변경도 따른다.
      const systemTheme = mq.matches ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', systemTheme === 'dark');
      document.documentElement.style.colorScheme = systemTheme;
      useAppStore.setState({ theme: systemTheme });
    } else {
      document.documentElement.classList.toggle('dark', stored === 'dark');
      document.documentElement.style.colorScheme = stored;
      useAppStore.setState({ theme: stored as 'light' | 'dark' });
    }

    isInitialized.current = true;

    const handleChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('theme')) return;
      const next = e.matches ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', next === 'dark');
      document.documentElement.style.colorScheme = next;
      useAppStore.setState({ theme: next });
    };

    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  // 수동으로 토글한 경우에만 저장한다.
  useEffect(() => {
    if (!isInitialized.current) return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  return null;
}
