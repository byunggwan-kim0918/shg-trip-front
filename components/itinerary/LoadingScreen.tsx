'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { useWizardStore } from '@/lib/stores/useWizardStore';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import { startItineraryGeneration, fetchItinerary, GenerationRejectedError } from '@/lib/data/itineraryService';
import { tripDays } from '@/lib/utils/tripStatus';
import { isEnrichValidationError, enrichErrorStep } from '@/lib/constants/enrichErrors';
import ErrorState from '@/components/common/ErrorState';
import type { ItineraryGenerateRequest } from '@/lib/types/itinerary';

/** F4: step-stream 이벤트의 스텝(확정 뼈대) — 백엔드 { name, startTime, category }. */
interface StreamStep {
  name: string;
  startTime: string | null;
  category: string | null;
}

/** 리디자인 진행 단계 칩 4개 (2f/3d). */
const STAGES: { key: string; label: string }[] = [
  { key: 'select', label: '장소 선별' },
  { key: 'route', label: '동선 최적화' },
  { key: 'time', label: '시간 배분' },
  { key: 'budget', label: '예산 정리' },
];

const SESSION_KEY = 'shg_active_job_id';

// 백엔드는 최적화 경로(OptimizedGenerationExecutor)와 fallback 경로
// (ItineraryGenerationExecutor)에서 서로 다른 stage 문자열을 보낸다.
// 모든 backend stage를 리디자인 4단계 칩으로 매핑한다.
const STAGE_BUCKET: Record<string, number> = {
  ENRICHING: 0,
  SEARCHING: 0,
  FALLBACK: 0,
  SYNCING: 0,
  SELECTING: 0,
  GENERATING: 1,
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
const KNOWN_PERCENTAGES = [10, 20, 30, 35, 50, 65, 70, 80, 90, 100];

function getNextTarget(current: number): number {
  for (const t of KNOWN_PERCENTAGES) {
    if (t > current) return t;
  }
  return 100;
}

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

export default function LoadingScreen() {
  const router = useRouter();
  const { data, reset } = useWizardStore();
  const { setCurrentItinerary } = useItineraryStore();
  const { display: progress, setTarget } = useSmoothedProgress();
  const [stage, setStage] = useState('ENRICHING');
  const [error, setError] = useState<string | null>(null);
  // enrich 검증 실패 errorCode(UNREALISTIC_BUDGET 등) — "조건 수정" 단계 점프에 사용
  const [errorCode, setErrorCode] = useState<string | null>(null);
  // F4: step-stream 수신한 day별 확정 뼈대 (dayNumber → steps) → 스켈레톤을 실카드로 교체
  const [streamedDays, setStreamedDays] = useState<Record<number, StreamStep[]>>({});
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const startedRef = useRef(false);
  const esRef = useRef<EventSource | null>(null);
  // complete 이벤트 수신 후 onerror 오발화 방지 플래그
  const completedRef = useRef(false);
  // Day 보드 열 수 — 새로고침 재연결 시 wizard 데이터가 없으면 3열 기본
  const dayCountRef = useRef(3);

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

      if (hasWizardData) {
        dayCountRef.current = Math.min(tripDays(data.startDate!, data.endDate!), 3);
      }

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

      // 정상 플로우: 새 생성 요청.
      // 모드는 필수 장소 유무로 파생 (자동/수동 모드 분리 폐지 — 5단계 통합 마법사).
      const req: ItineraryGenerateRequest = {
        mode: data.selectedPlaces.length > 0 ? 'MANUAL' : 'AUTO',
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
        customPlaceNames: data.selectedPlaces
          .filter((p) => p.id < 0)
          .map((p) => p.name)
          .slice(0, 5),
      };

      let jobId: string;
      try {
        jobId = await startItineraryGeneration(req);
      } catch (e) {
        // 429(차단·쿼터 초과)는 errorCode를 담아 종료 상태로 표시(재시도 무의미)
        if (e instanceof GenerationRejectedError) {
          setError(e.message);
          setErrorCode(e.code);
        } else {
          setError(e instanceof Error ? e.message : '일정 생성 요청에 실패했습니다.');
        }
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

    // F4: 확정된 뼈대(장소·시간)를 day별로 수신 → 해당 Day 스켈레톤을 실카드로 교체.
    eventSource.addEventListener('step-stream', (e) => {
      try {
        const payload = JSON.parse((e as MessageEvent).data) as { dayNumber: number; steps: StreamStep[] };
        if (payload?.dayNumber && Array.isArray(payload.steps)) {
          setStreamedDays((prev) => ({ ...prev, [payload.dayNumber]: payload.steps }));
        }
      } catch { /* 잘못된 페이로드 무시 */ }
    });

    // complete: 구조(day·순서·시간·동선) 일정이 확정된 시점. story(가이드북 문장)는 아직
    // 비동기로 채워지는 중이므로 여기서 곧바로 결과 화면으로 이동한다.
    eventSource.addEventListener('complete', async () => {
      completedRef.current = true;
      setTarget(100);
      setStage('COMPLETE');

      // fetch/json은 네트워크 단절 시 throw → unhandled rejection 방지 위해 감싼다.
      try {
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
      } catch {
        setError('일정을 불러오는데 실패했습니다. 네트워크를 확인해주세요.');
      }
    });

    // story-ready/story-failed: 화면 전환 전에 먼저 도착하는 경우를 대비한 정리용 리스너.
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
        ? (JSON.parse((e as MessageEvent).data) as { message: string; errorCode?: string })
        : null;
      setError(payload?.message ?? 'AI 일정 생성 중 오류가 발생했습니다.');
      setErrorCode(payload?.errorCode ?? null);
      sessionStorage.removeItem(SESSION_KEY);
    });

    // onerror: 서버 complete 후 브라우저가 재연결 시도할 때도 발화함
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
    // 차단·쿼터 초과(PLANNING_003/004)는 재시도 무의미 → "확인"만.
    const isBlocked = errorCode === 'PLANNING_003' || errorCode === 'PLANNING_004';
    // 입력 검증 실패(비현실 예산·테마 상충·여행지/기간)면 "조건 수정"으로 해당 단계 점프.
    // 그 외(서버·AI 오류)는 "다시 시도"로 확인 단계(4)에서 재제출 — 두 경우 모두 입력값 보존.
    const isValidationError = isEnrichValidationError(errorCode);
    const targetStep = isValidationError ? enrichErrorStep(errorCode) : 4;
    return (
      <div className="flex min-h-[65vh] items-center justify-center px-4">
        <ErrorState
          className="w-full max-w-sm"
          description={error}
          errorCode={errorCode ?? undefined}
          retryLabel={isValidationError ? '조건 수정' : '다시 시도'}
          onRetry={isBlocked ? undefined : () => router.push(`/main/plan/new?builder=1&step=${targetStep}`)}
          secondaryLabel={isBlocked ? '확인' : '처음으로'}
          onSecondary={() => router.push('/main')}
        />
      </div>
    );
  }

  const clampedProgress = Math.min(progress, 100);
  const currentStageIdx = getStageIndex(stage);
  const dayCount = dayCountRef.current;

  return (
    <div
      className={`mx-auto flex min-h-[65vh] w-full max-w-[632px] flex-col justify-center px-4 py-8 transition-all duration-700 ease-out ${
        fadeOut ? 'opacity-0 scale-95' : visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 translate-y-4'
      }`}
    >
      {/* 헤더: 점 3개 로딩 + 타이틀 */}
      <div className="mb-[22px] text-center">
        <div className="mb-2.5 inline-flex items-center gap-1">
          {[0, 0.2, 0.4].map((delay) => (
            <span
              key={delay}
              className="h-2 w-2 rounded-full bg-accent"
              style={{ animation: `shg-blink 1.2s infinite`, animationDelay: `${delay}s` }}
            />
          ))}
        </div>
        <div className="text-xl font-extrabold tracking-[-0.02em] text-foreground">
          AI가 일정을 짜고 있어요
        </div>
        <div className="mt-1.5 text-[13px] text-muted">
          {stageMessages[stage] ?? stageMessages.ENRICHING} · {clampedProgress}% · 약 20초
        </div>
      </div>

      {/* 진행 단계 칩 4개 */}
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {STAGES.map((s, i) => {
          const isDone = i < currentStageIdx || stage === 'COMPLETE';
          const isCurrent = i === currentStageIdx && stage !== 'COMPLETE';
          return (
            <span
              key={s.key}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                isDone
                  ? 'bg-status-done-bg text-status-done'
                  : isCurrent
                    ? 'bg-accent-soft text-accent-weak-fg'
                    : 'bg-surface-3 text-muted-2'
              }`}
            >
              {isDone ? (
                <Check size={11} strokeWidth={3} aria-hidden="true" />
              ) : isCurrent ? (
                <span
                  className="h-[11px] w-[11px] rounded-full border-2 border-accent shg-spin"
                  style={{ borderTopColor: 'transparent' }}
                  aria-hidden="true"
                />
              ) : (
                <span className="h-[9px] w-[9px] rounded-full border-[1.5px] border-current" aria-hidden="true" />
              )}
              {s.label}
            </span>
          );
        })}
      </div>

      {/* Day 보드 — step-stream 수신 시 스켈레톤을 실카드로 교체 (F4) */}
      <div
        className="grid min-h-0 flex-1 gap-3"
        style={{ gridTemplateColumns: `repeat(${dayCount}, 1fr)` }}
      >
        {Array.from({ length: dayCount }, (_, d) => {
          const daySteps = streamedDays[d + 1];
          return (
            <div key={d} className="flex flex-col gap-[9px]">
              <div
                className={`text-[12.5px] font-extrabold ${
                  d === 0 ? 'text-accent-weak-fg' : 'text-muted-2'
                }`}
              >
                Day {d + 1}
              </div>
              {daySteps
                ? daySteps.slice(0, 5).map((step, r) => (
                    <div
                      key={r}
                      className="flex min-h-[52px] animate-[shg-fade-in_0.4s_ease-out] flex-col justify-center gap-0.5 rounded-[11px] border border-card-border bg-card-bg px-3 py-2"
                    >
                      <div className="truncate text-[12.5px] font-bold text-foreground">{step.name}</div>
                      <div className="truncate text-[11px] font-semibold text-muted-2">
                        {step.startTime ?? ''}
                        {step.startTime && step.category ? ' · ' : ''}
                        {step.category ?? ''}
                      </div>
                    </div>
                  ))
                : [0, 1, 2].map((r) => (
                    <div
                      key={r}
                      className="h-[52px] rounded-[11px] shg-shimmer"
                      style={{ animationDelay: `${(d * 0.15 + r * 0.2) % 0.6}s` }}
                    />
                  ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
