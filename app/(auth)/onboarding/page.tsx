'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';

export default function OnboardingPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = useAuthStore((s) => s.user);
  const fetchSession = useAuthStore((s) => s.fetchSession);

  // 세션 로드 후 이미 닉네임이 있으면 /main으로 리다이렉트
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (user?.nickname) {
      router.replace('/main');
    }
  }, [user, router]);

  const isValid = nickname.trim().length >= 2 && nickname.trim().length <= 20;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      setError('닉네임은 2~20자로 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/proxy/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ nickname: nickname.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message || '프로필 설정에 실패했습니다.');
        return;
      }

      router.replace('/main');
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-sm flex flex-col items-center">
      <div className="mb-10 flex flex-col items-center gap-3">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-extrabold text-white shadow-[0_14px_30px_-12px_var(--accent)]"
          style={{ background: 'linear-gradient(140deg, var(--accent), oklch(0.62 0.15 200))' }}
        >
          S
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">환영합니다!</h1>
          <p className="mt-1 text-sm text-muted">사용할 닉네임을 설정해주세요</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        <div>
          <input
            type="text"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setError('');
            }}
            placeholder="닉네임 (2~20자)"
            maxLength={20}
            className="w-full px-4 py-3.5 rounded-xl border border-card-border focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 text-sm transition-all bg-card-bg text-foreground placeholder:text-muted-2"
          />
          {error && (
            <p className="mt-2 text-xs text-danger">{error}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="w-full py-3.5 rounded-xl bg-accent hover:bg-accent-hover disabled:bg-muted/30 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors cursor-pointer shadow-[0_10px_24px_-10px_var(--accent)]"
        >
          {isSubmitting ? '설정 중...' : '시작하기'}
        </button>
      </form>
    </div>
  );
}
