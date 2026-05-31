'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/stores';

/**
 * 시스템 다크 모드 설정을 감지하고 html 요소에 dark 클래스를 동기화합니다.
 * 루트 레이아웃에 한 번만 마운트합니다.
 */
export default function ThemeInitializer() {
  const theme = useAppStore((s) => s.theme);
  const isInitialized = useRef(false);

  // 초기 마운트 시 시스템 설정 감지 + 변경 리스닝
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    const stored = localStorage.getItem('theme');
    if (!stored) {
      // 저장된 테마 없음 → 시스템 설정 따르기 (localStorage에 저장하지 않음)
      const systemTheme = mq.matches ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', systemTheme === 'dark');
      document.documentElement.style.colorScheme = systemTheme;
      useAppStore.setState({ theme: systemTheme });
    } else {
      // 사용자가 수동으로 설정한 테마 복원
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

  // 사용자가 수동으로 테마를 토글한 경우에만 localStorage에 저장
  useEffect(() => {
    if (!isInitialized.current) return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  return null;
}
