'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import { NEW_TRIP_SENTENCE_KEY } from '@/lib/constants/newTrip';

interface Props {
  sentence: string;
  label: string;
  variant?: 'primary' | 'secondary';
}

/** 비로그인이면 middleware가 /login으로 보내므로 문장을 sessionStorage에 먼저 남긴다. */
export default function StartTripButton({ sentence, label, variant = 'primary' }: Props) {
  const router = useRouter();
  const primary = variant === 'primary';

  return (
    <button
      type="button"
      onClick={() => {
        try {
          sessionStorage.setItem(NEW_TRIP_SENTENCE_KEY, sentence);
        } catch {
          /* 저장이 막혀도 빈 입력으로 시작한다 */
        }
        router.push('/main/plan/new');
      }}
      className={
        primary
          ? 'inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-accent px-5 py-3 text-sm font-bold text-accent-fg transition-[filter,transform] hover:brightness-105 active:scale-[0.98]'
          : 'inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-card-border bg-card-bg px-5 py-3 text-sm font-bold text-foreground transition-colors hover:bg-surface-hover'
      }
    >
      {primary && <Sparkles size={14} aria-hidden="true" />}
      {label}
      {!primary && <ArrowRight size={14} aria-hidden="true" />}
    </button>
  );
}
