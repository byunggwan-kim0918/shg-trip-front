'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import { NEW_TRIP_SENTENCE_KEY } from '@/lib/constants/newTrip';

export default function SentenceStart({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const [sentence, setSentence] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        try {
          sessionStorage.setItem(NEW_TRIP_SENTENCE_KEY, sentence.trim() || placeholder);
        } catch {
          /* 저장이 막혀도 빈 입력으로 시작한다 */
        }
        router.push('/main/plan/new');
      }}
      className="flex w-full flex-col gap-2.5 rounded-xl border-[1.5px] border-accent bg-card-bg p-3 focus-within:ring-2 focus-within:ring-accent/25 sm:flex-row sm:items-center sm:py-2 sm:pl-4 sm:pr-2"
    >
      <Sparkles size={16} className="hidden shrink-0 text-accent-weak-fg sm:block" aria-hidden="true" />
      <input
        type="text"
        value={sentence}
        onChange={(e) => setSentence(e.target.value)}
        placeholder={placeholder}
        aria-label="여행 문장 입력"
        className="w-full flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-2"
      />
      <button
        type="submit"
        className="flex shrink-0 items-center justify-center gap-1.5 rounded-[10px] bg-accent px-5 py-2.5 text-sm font-bold text-accent-fg transition-[filter,transform] hover:brightness-105 active:scale-[0.98]"
      >
        만들기 <ArrowRight size={14} aria-hidden="true" />
      </button>
    </form>
  );
}
