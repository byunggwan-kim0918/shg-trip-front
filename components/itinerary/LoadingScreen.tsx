'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  MapPin,
  CheckCircle2,
  Save,
  AlertCircle,
  Plane,
  Car,
  Train,
  Ship,
  Bus,
  Bike,
  LucideIcon,
} from 'lucide-react';
import { useWizardStore } from '@/lib/stores/useWizardStore';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import { startItineraryGeneration, fetchItinerary } from '@/lib/data/itineraryService';
import type { ItineraryGenerateRequest } from '@/lib/types/itinerary';

const STAGES: { key: string; label: string; icon: LucideIcon }[] = [
  { key: 'ENRICHING', label: '여행 정보 분석', icon: Search },
  { key: 'GENERATING', label: '최적 동선 계산', icon: MapPin },
  { key: 'VALIDATING', label: '일정 품질 검증', icon: CheckCircle2 },
  { key: 'SAVING', label: '맞춤 일정 저장', icon: Save },
];

const SESSION_KEY = 'shg_active_job_id';

function getStageIndex(stage: string): number {
  const idx = STAGES.findIndex((s) => s.key === stage);
  return idx === -1 ? 0 : idx;
}

const VEHICLES: LucideIcon[] = [Plane, Car, Train, Ship, Bus, Bike];
function getRandomVehicle(): LucideIcon {
  return VEHICLES[Math.floor(Math.random() * VEHICLES.length)];
}

function useSmoothedProgress() {
  const [display, setDisplay] = useState(0);
  const targetRef = useRef(0);
  const displayRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const tick = useCallback(() => {
    const target = targetRef.current;
    const current = displayRef.current;

    if (current < target) {
      const remaining = target - current;
      const step = Math.max(0.15, remaining * 0.03);
      const next = Math.min(current + step, target);
      displayRef.current = next;
      setDisplay(Math.round(next));
    } else if (target < 100) {
      const nextTarget = getNextTarget(target);
      const ceiling = target + (nextTarget - target) * 0.8;
      if (current < ceiling) {
        displayRef.current = current + 0.05;
        setDisplay(Math.round(current + 0.05));
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
  const [vehicle, setVehicle] = useState<LucideIcon>(Plane);
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const startedRef = useRef(false);
  const esRef = useRef<EventSource | null>(null);
  // complete 이벤트 수신 후 onerror 오발화 방지 플래그
  const completedRef = useRef(false);

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
      // wizard 데이터 없이 직접 접근한 경우 — 새로고침 시 jobId 재사용 시도
      const hasWizardData = data.destination.trim().length > 0 && !!data.startDate && !!data.endDate;
      const savedJobId = sessionStorage.getItem(SESSION_KEY);

      // 새로고침 케이스: wizard 데이터는 없지만 진행 중인 jobId가 있음
      if (!hasWizardData && savedJobId) {
        reconnectToJob(savedJobId);
        return;
      }

      // wizard 데이터도 없고 jobId도 없으면 → 플랜 페이지로
      if (!hasWizardData) {
        router.replace('/main/plan/new');
        return;
      }

      // 정상 플로우: 새 생성 요청
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

      // jobId를 sessionStorage에 저장 — 새로고침 시 재연결에 사용
      sessionStorage.setItem(SESSION_KEY, jobId);
      connectToJob(jobId);
    };

    run();
    return () => { esRef.current?.close(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 새로고침 후 기존 jobId로 SSE 재연결 */
  function reconnectToJob(jobId: string) {
    // 이미 완료된 작업인지 먼저 result API로 확인
    fetch(`/api/proxy/itineraries/generate/${jobId}/result`, { credentials: 'include' })
      .then(async (res) => {
        if (res.ok) {
          const body = await res.json() as { success: boolean; data: number };
          if (body.success) {
            // 이미 완료됨 — 바로 결과 처리
            await handleComplete(jobId, body.data);
            return;
          }
        }
        // 404(아직 진행 중이거나 result 없음) → SSE 재연결 시도
        // SSE 연결 자체가 실패하면 onerror에서 에러 처리됨
        connectToJob(jobId);
      })
      .catch(() => {
        // 네트워크 오류 → SSE 재연결 시도 (result가 아직 없을 수 있음)
        connectToJob(jobId);
      });
  }

  /** SSE 연결 및 이벤트 핸들러 등록 */
  function connectToJob(jobId: string) {
    completedRef.current = false;
    const sseUrl = `/api/proxy/itineraries/generate/${jobId}/stream`;
    const eventSource = new EventSource(sseUrl, { withCredentials: true });
    esRef.current = eventSource;

    eventSource.addEventListener('progress', (e) => {
      const payload = JSON.parse(e.data) as { percentage: number; message: string; stage: string };
      setTarget(payload.percentage);
      setStage(payload.stage);
    });

    eventSource.addEventListener('complete', async () => {
      completedRef.current = true;
      eventSource.close();
      setTarget(100);
      setStage('COMPLETE');

      const res = await fetch(`/api/proxy/itineraries/generate/${jobId}/result`, {
        credentials: 'include',
      });
      if (!res.ok) {
        setError('일정을 불러오는데 실패했습니다.');
        return;
      }
      const body = await res.json() as { success: boolean; data: number };
      if (!body.success) {
        setError('일정을 불러오는데 실패했습니다.');
        return;
      }
      await handleComplete(jobId, body.data);
    });

    eventSource.addEventListener('error', (e) => {
      completedRef.current = true;
      eventSource.close();
      const payload = (e as MessageEvent).data
        ? (JSON.parse((e as MessageEvent).data) as { message: string })
        : null;
      setError(payload?.message ?? 'AI 일정 생성 중 오류가 발생했습니다.');
      sessionStorage.removeItem(SESSION_KEY);
    });

    // onerror: 서버 complete 후 브라우저가 재연결 시도할 때도 발화함
    // completedRef로 정상 완료 후 발화는 무시
    eventSource.onerror = () => {
      if (completedRef.current) return;
      eventSource.close();
      setError('서버 연결이 끊어졌습니다. 다시 시도해주세요.');
      sessionStorage.removeItem(SESSION_KEY);
    };
  }

  /** 완료 처리 공통 로직 */
  async function handleComplete(jobId: string, itineraryId: number) {
    try {
      const itinerary = await fetchItinerary(itineraryId);
      setCurrentItinerary(itinerary);
      reset();
      sessionStorage.removeItem(SESSION_KEY);
      setFadeOut(true);
      setTimeout(() => router.push(`/main/itinerary/${itineraryId}`), 600);
    } catch {
      setError('일정을 불러오는데 실패했습니다.');
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] px-4 gap-4">
        <div className="glass-card rounded-2xl p-8 text-center max-w-sm">
          <AlertCircle size={48} className="mx-auto mb-4 text-danger" aria-hidden="true" />
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

        {/* 아이콘 트랙 */}
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
            className="loading-vehicle absolute top-1/2 -translate-y-1/2"
            style={{ left: `${Math.min(clampedProgress, 95)}%`, transition: 'left 1s ease-out' }}
          >
            {React.createElement(vehicle, { size: 28, 'aria-hidden': 'true', className: 'text-accent' })}
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
                <s.icon size={16} aria-hidden="true" />
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
