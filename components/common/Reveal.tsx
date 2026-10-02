'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  /** stagger 지연(ms). 그룹 진입 시 50ms 간격 권장. */
  delay?: number;
  className?: string;
};

/** 진입 모션: 기존 globals.css의 fade-in-up 키프레임을 재사용한다(병렬 시스템 금지). */
const ENTER =
  'motion-safe:[animation:fade-in-up_300ms_cubic-bezier(0.23,1,0.32,1)_both]';
/** 발화 전 숨김. motion-safe로만 걸어서 reduced-motion 사용자에겐 항상 보이게 한다. */
const HIDDEN = 'motion-safe:opacity-0';

/**
 * 뷰포트에 들어올 때 한 번만 진입 모션을 재생한다.
 *
 * 접힘선 아래 요소에 로드 시점 애니메이션을 걸면 사용자가 스크롤해 오기 전에
 * 재생이 끝나 아무도 보지 못한다. 그래서 IntersectionObserver로 실제로
 * 보이는 순간에 발화시키고, 한 번 재생 후 관찰을 끊는다.
 *
 * prefers-reduced-motion 처리는 상태가 아니라 CSS(motion-safe)에 맡긴다.
 * 그래서 모션 비선호 사용자는 숨김도 애니메이션도 적용받지 않는다.
 */
export default function Reveal({ children, delay = 0, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -80px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-reveal=""
      className={`${shown ? ENTER : HIDDEN} ${className}`}
      style={shown && delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
