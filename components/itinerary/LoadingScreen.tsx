'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  MapPin,
  CheckCircle2,
  Save,
  AlertCircle,
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

// 백엔드는 최적화 경로(OptimizedGenerationExecutor)와 fallback 경로
// (ItineraryGenerationExecutor)에서 서로 다른 stage 문자열을 보낸다.
// STAGES에 없는 값(SEARCHING/FALLBACK/SYNCING/SELECTING/OPTIMIZING)이 오면
// 기존 코드는 무조건 0번(여행 정보 분석)으로 떨어져 퍼센트만 올라가고
// 단계 표시는 멈춘 것처럼 보였다 — 모든 backend stage를 4단계로 매핑한다.
const STAGE_BUCKET: Record<string, number> = {
  ENRICHING: 0,
  SEARCHING: 1,
  FALLBACK: 1,
  GENERATING: 1,
  SYNCING: 1,
  SELECTING: 1,
  OPTIMIZING: 1,
  VALIDATING: 2,
  SAVING: 3,
  COMPLETE: 3,
};

function getStageIndex(stage: string): number {
  return STAGE_BUCKET[stage] ?? 0;
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

// 백엔드가 실제로 전송하는 퍼센트 값들 (최적화 경로 + fallback 경로 합집합).
// 여기 없는 값은 다음 목표 추정 시 더 일찍 정체된 것처럼 보이게 만든다.
const KNOWN_PERCENTAGES = [10, 20, 30, 35, 50, 65, 70, 80, 90, 100];

function getNextTarget(current: number): number {
  for (const t of KNOWN_PERCENTAGES) {
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
        transportPref: data.transportPref,
        budget: data.budget,
        startDate: data.startDate!,
        endDate: data.endDate!,
        description: data.description || null,
        selectedPlaceIds: data.selectedPlaces
          .filter((p) => p.id > 0)
          .map((p) => p.id),
        // 자유입력(음수 임시 ID) 장소는 이름으로 전달 — 백엔드가 Google 검색으로 실장소화.
        // (기존엔 여기서 조용히 버려져 사용자가 넣은 장소가 서버에 도달조차 안 했음)
        customPlaceNames: data.selectedPlaces
          .filter((p) => p.id < 0)
          .map((p) => p.name)
          .slice(0, 5),
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

    // complete: 구조(day·순서·시간·동선) 일정이 확정된 시점. story(가이드북 문장)는 아직
    // 비동기로 채워지는 중이므로 여기서 곧바로 결과 화면으로 이동한다 — 이게 체감 속도를
    // 줄이는 지점. 백엔드는 story-ready/story-failed까지 같은 SSE 연결을 유지하지만,
    // 화면 전환(unmount)으로 연결이 자연히 정리되며 백엔드는 이를 정상 처리한다.
    eventSource.addEventListener('complete', async () => {
      completedRef.current = true;
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

    // story-ready/story-failed: 화면 전환 전에 먼저 도착하는 경우를 대비한 정리용 리스너.
    // (구조 일정은 이미 complete에서 처리됐으므로 추가 동작 없음)
    eventSource.addEventListener('story-ready', () => {
      eventSource.close();
    });
    eventSource.addEventListener('story-failed', () => {
      eventSource.close();
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
  const CurrentIcon = STAGES[currentStageIdx].icon;

  const stageMessages: Record<string, string> = {
    ENRICHING: '여행지 정보를 분석하고 있어요',
    SEARCHING: '어울리는 장소를 찾고 있어요',
    FALLBACK: '다른 방식으로 장소를 다시 찾고 있어요',
    GENERATING: 'AI가 최적의 장소를 찾고 있어요',
    SYNCING: '최신 장소 정보를 확인하고 있어요',
    SELECTING: '일자별로 장소를 배치하고 있어요',
    OPTIMIZING: '동선과 이동 시간을 다듬고 있어요',
    VALIDATING: '동선과 일정을 검증하고 있어요',
    SAVING: '맞춤 일정을 저장하고 있어요',
    COMPLETE: '일정이 완성됐어요!',
  };

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clampedProgress / 100);

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-[65vh] px-6 transition-all duration-700 ease-out ${
        fadeOut ? 'opacity-0 scale-95' : visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 translate-y-4'
      }`}
    >
      <div className="glass-card rounded-3xl p-8 sm:p-10 w-full max-w-md relative overflow-hidden">
        <div className="absolute inset-0 loading-shimmer pointer-events-none" />

        {/* 원형 진행률 */}
        <div className="relative w-40 h-40 mx-auto mb-8">
          <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
            <circle
              cx="80" cy="80" r={radius}
              fill="none" stroke="currentColor" strokeWidth="10"
              className="text-surface/70"
            />
            <circle
              cx="80" cy="80" r={radius}
              fill="none" strokeWidth="10" strokeLinecap="round"
              className="loading-ring"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <CurrentIcon size={22} aria-hidden="true" className="text-accent mb-1 loading-icon-pulse" />
            <p className="text-3xl font-extrabold text-foreground tabular-nums tracking-tight">
              {clampedProgress}<span className="text-base text-muted font-bold">%</span>
            </p>
          </div>
        </div>

        {/* 단계 스테퍼 */}
        <div className="grid grid-cols-4 gap-1 mb-5">
          {STAGES.map((s, i) => (
            <div key={s.key} className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-all duration-500 ${
                  i < currentStageIdx
                    ? 'bg-accent text-white scale-100'
                    : i === currentStageIdx
                      ? 'bg-accent/15 text-accent scale-110 loading-stage-pulse'
                      : 'bg-surface/60 text-muted/50 scale-95'
                }`}
              >
                {i < currentStageIdx ? (
                  <CheckCircle2 size={16} aria-hidden="true" />
                ) : (
                  <s.icon size={16} aria-hidden="true" />
                )}
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
        .loading-ring {
          stroke: var(--accent);
          transition: stroke-dashoffset 0.6s ease-out;
          filter: drop-shadow(0 0 6px color-mix(in srgb, var(--accent) 50%, transparent));
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
        @keyframes stage-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 0 6px rgba(59, 130, 246, 0); }
        }
        .loading-stage-pulse {
          animation: stage-pulse 2s ease-in-out infinite;
        }
        @keyframes icon-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.92); }
        }
        .loading-icon-pulse {
          animation: icon-pulse 1.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
