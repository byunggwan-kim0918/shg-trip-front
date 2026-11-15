'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/stores';

/** 루트 레이아웃에 한 번만 마운트한다. */
export default function ThemeInitializer() {
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
      const storedTheme = stored === 'dark' ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', storedTheme === 'dark');
      document.documentElement.style.colorScheme = storedTheme;
      useAppStore.setState({ theme: storedTheme });
    }

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

  return null;
}
