'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWizardStore } from '@/lib/stores/useWizardStore';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import { startItineraryGeneration, fetchItinerary } from '@/lib/data/itineraryService';
import type { ItineraryGenerateRequest } from '@/lib/types/itinerary';

const STAGES: { key: string; label: string; icon: string }[] = [
  { key: 'ENRICHING', label: '여행 정보 분석', icon: '🔍' },
  { key: 'GENERATING', label: '최적 동선 계산', icon: '🗺️' },
  { key: 'VALIDATING', label: '일정 품질 검증', icon: '✅' },
  { key: 'SAVING', label: '맞춤 일정 저장', icon: '💾' },
];

function getStageIndex(stage: string): number {
  const idx = STAGES.findIndex((s) => s.key === stage);
  return idx === -1 ? 0 : idx;
}

const VEHICLES = ['✈️', '🚗', '🚂', '⛵', '🚌', '🛵', '🚁', '🛳️', '🚕', '🏍️'];

function getRandomVehicle(): string {
  return VEHICLES[Math.floor(Math.random() * VEHICLES.length)];
}

/**
 * SSE에서 실제 진행률이 오면 그 값을 목표로 설정하고,
 * 목표까지 부드럽게 올라가되, 목표 직전에서 감속하여 자연스럽게 대기.
 * AI 호출 중 멈춰 보이지 않도록 중간에 천천히 올라감.
 */
function useSmoothedProgress() {
  const [display, setDisplay] = useState(0);
  const targetRef = useRef(0);
  const displayRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const tick = useCallback(() => {
    const target = targetRef.current;
    const current = displayRef.current;

    if (current < target) {
      // 목표까지 남은 거리에 비례해서 속도 조절 (가까울수록 느리게)
      const remaining = target - current;
      const step = Math.max(0.15, remaining * 0.03);
      const next = Math.min(current + step, target);
      displayRef.current = next;
      setDisplay(Math.round(next));
    } else if (target < 100) {
      // 목표에 도달했지만 아직 다음 SSE 안 옴 → 아주 천천히 올라감 (다음 목표의 80%까지만)
      const nextTarget = getNextTarget(target);
      const ceiling = target + (nextTarget - target) * 0.8;
      if (current < ceiling) {
        const next = current + 0.05;
        displayRef.current = next;
        setDisplay(Math.round(next));
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [tick]);

  const setTarget = useCallback((value: number) => {
    targetRef.current = value;
  }, []);

  return { display, setTarget };
}

/** 현재 목표 다음에 올 SSE 목표값 추정 */
function getNextTarget(current: number): number {
  const targets = [20, 50, 70, 90, 100];
  for (const t of targets) {
    if (t > current) return t;
  }
  return 100;
}

export default function LoadingScreen() {
  const router = useRouter();
  const { data, reset } = useWizardStore();
  const { setCurrentItinerary } = useItineraryStore();
  const { display: progress, setTarget } = useSmoothedProgress();
  const [stage, setStage] = useState('ENRICHING');
  const [error, setError] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState('✈️');
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const startedRef = useRef(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setVehicle(getRandomVehicle());
    const interval = setInterval(() => setVehicle(getRandomVehicle()), 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const run = async () => {
      const req: ItineraryGenerateRequest = {
        mode: data.mode === 'manual' ? 'MANUAL' : 'AUTO',
        destination: data.destination,
        themes: data.themes,
        categories: data.categories,
        pace: data.pace,
        budget: data.budget,
        startDate: data.startDate!,
        endDate: data.endDate!,
        description: data.description || null,
        selectedPlaceIds: data.selectedPlaces
          .filter((p) => p.id > 0)
          .map((p) => p.id),
      };

      let jobId: string;
      try {
        jobId = await startItineraryGeneration(req);
      } catch (e) {
        setError(e instanceof Error ? e.message : '일정 생성 요청에 실패했습니다.');
        return;
      }

      const sseUrl = `/api/proxy/itineraries/generate/${jobId}/stream`;
      const eventSource = new EventSource(sseUrl, { withCredentials: true });
      esRef.current = eventSource;

      eventSource.addEventListener('progress', (e) => {
        const payload = JSON.parse(e.data) as { percentage: number; message: string; stage: string };
        setTarget(payload.percentage);
        setStage(payload.stage);
      });

      eventSource.addEventListener('complete', async (e) => {
        eventSource.close();
        setTarget(100);
        setStage('COMPLETE');
        try {
          // itineraryId는 SSE에 포함되지 않음 — 인증된 result API로 조회
          const res = await fetch(`/api/proxy/itineraries/generate/${jobId}/result`, {
            credentials: 'include',
          });
          if (!res.ok) throw new Error('결과 조회 실패');
          const body = await res.json() as { success: boolean; data: number };
          const itineraryId = body.data;
          const itinerary = await fetchItinerary(itineraryId);
          setCurrentItinerary(itinerary);
          reset();
          setFadeOut(true);
          setTimeout(() => router.push(`/main/itinerary/${itineraryId}`), 600);
        } catch {
          setError('일정을 불러오는데 실패했습니다.');
        }
      });

      eventSource.addEventListener('error', (e) => {
        eventSource.close();
        const payload = (e as MessageEvent).data
          ? (JSON.parse((e as MessageEvent).data) as { message: string })
          : null;
        setError(payload?.message ?? 'AI 일정 생성 중 오류가 발생했습니다.');
      });

      eventSource.onerror = () => {
        eventSource.close();
        setError('서버 연결이 끊어졌습니다. 다시 시도해주세요.');
      };
    };

    run();
    return () => { esRef.current?.close(); };
  }, [data, setCurrentItinerary, reset, router, setTarget]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] px-4 gap-4">
        <div className="glass-card rounded-2xl p-8 text-center max-w-sm">
          <p className="text-4xl mb-4">😥</p>
          <p className="text-danger text-sm mb-4">{error}</p>
          <button
            type="button"
            onClick={() => router.push('/main/plan/new')}
            className="px-6 py-2.5 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover transition-colors min-h-[44px]"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const clampedProgress = Math.min(progress, 100);
  const currentStageIdx = getStageIndex(stage);

  /** 현재 단계에 맞는 메시지 */
  const stageMessages: Record<string, string> = {
    ENRICHING: '여행지 정보를 분석하고 있어요',
    GENERATING: 'AI가 최적의 장소를 찾고 있어요',
    VALIDATING: '동선과 일정을 검증하고 있어요',
    SAVING: '맞춤 일정을 저장하고 있어요',
    COMPLETE: '일정이 완성됐어요!',
  };

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-[65vh] px-6 transition-all duration-700 ease-out ${
        fadeOut ? 'opacity-0 scale-95' : visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 translate-y-4'
      }`}
    >
      <div className="glass-card rounded-3xl p-8 sm:p-10 w-full max-w-md relative overflow-hidden">
        <div className="absolute inset-0 loading-shimmer pointer-events-none" />

        {/* 이모지 트랙 */}
        <div className="relative w-full h-14 mb-8">
          <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2">
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
            <div className="absolute top-1/2 left-0 w-1.5 h-1.5 rounded-full bg-accent/40 -translate-y-1/2" />
            <div className="absolute top-1/2 left-1/4 w-1.5 h-1.5 rounded-full bg-accent/40 -translate-y-1/2" />
            <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-accent/40 -translate-y-1/2" />
            <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 rounded-full bg-accent/40 -translate-y-1/2" />
            <div className="absolute top-1/2 right-0 w-1.5 h-1.5 rounded-full bg-accent/40 -translate-y-1/2" />
          </div>
          <div
            className="loading-vehicle absolute text-3xl top-1/2 -translate-y-1/2"
            style={{ left: `${Math.min(clampedProgress, 95)}%`, transition: 'left 1s ease-out' }}
          >
            {vehicle}
          </div>
        </div>

        {/* 퍼센트 + 프로그레스 */}
        <div className="text-center mb-6">
          <p className="text-5xl font-extrabold text-foreground tabular-nums tracking-tight mb-3">
            {clampedProgress}<span className="text-2xl text-muted font-bold">%</span>
          </p>
          <div className="w-full h-2.5 bg-surface/80 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out loading-bar-gradient"
              style={{ width: `${clampedProgress}%` }}
            />
          </div>
        </div>

        {/* 단계 스테퍼 */}
        <div className="grid grid-cols-4 gap-1 mb-4">
          {STAGES.map((s, i) => (
            <div key={s.key} className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all duration-500 ${
                  i < currentStageIdx
                    ? 'bg-accent/15 scale-100'
                    : i === currentStageIdx
                      ? 'bg-accent/20 scale-110 loading-stage-pulse'
                      : 'bg-surface/60 scale-95 opacity-40'
                }`}
              >
                {s.icon}
              </div>
              <span
                className={`text-[10px] leading-tight text-center transition-colors duration-300 ${
                  i <= currentStageIdx ? 'text-foreground/80 font-medium' : 'text-muted/50'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* 현재 단계 메시지 */}
        <p className="text-sm text-muted text-center">
          {stageMessages[stage] ?? stageMessages.ENRICHING}
        </p>
      </div>

      <style jsx>{`
        .loading-vehicle {
          filter: drop-shadow(0 2px 6px rgba(0,0,0,0.12));
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .loading-shimmer::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(59, 130, 246, 0.04) 40%,
            rgba(59, 130, 246, 0.08) 50%,
            rgba(59, 130, 246, 0.04) 60%,
            transparent 100%
          );
          animation: shimmer 2.5s ease-in-out infinite;
        }
        .loading-bar-gradient {
          background: linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 70%, white));
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.3);
        }
        @keyframes stage-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 0 6px rgba(59, 130, 246, 0); }
        }
        .loading-stage-pulse {
          animation: stage-pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
