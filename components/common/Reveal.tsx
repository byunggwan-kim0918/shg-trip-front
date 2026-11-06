'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  /** stagger 지연(ms). 그룹 진입 시 50ms 간격 권장. */
  delay?: number;
  className?: string;
};

/** 모션 정의를 한 곳에 두려고 globals.css의 fade-in-up 키프레임을 재사용한다. */
const ENTER =
  'motion-safe:[animation:fade-in-up_300ms_cubic-bezier(0.23,1,0.32,1)_both]';
/** 발화 전 숨김. motion-safe로만 걸어서 reduced-motion 사용자에겐 항상 보이게 한다. */
const HIDDEN = 'motion-safe:opacity-0';

/**
 * 접힘선 아래 요소는 로드 시점에 재생하면 아무도 못 보므로 보이는 순간 한 번만 재생한다.
 * 처음부터 숨기면 observer가 발화하지 않을 때 빈 칸으로 남아, 아래에 있다고 확인된 요소만 숨긴다.
 */
export default function Reveal({ children, delay = 0, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'static' | 'hidden' | 'shown'>('static');

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    let first = true;
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      // 빠르게 스크롤해 이미 지나친 요소도 보인 것으로 친다
      const reached = entry.isIntersecting || entry.boundingClientRect.top < 0;
      if (first) {
        first = false;
        if (reached) {
          io.disconnect();
          return;
        }
        setPhase('hidden');
        return;
      }
      if (reached) {
        setPhase('shown');
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-reveal=""
      className={`${phase === 'shown' ? ENTER : phase === 'hidden' ? HIDDEN : ''} ${className}`}
      style={phase === 'shown' && delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
