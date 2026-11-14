'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import { fetchGenerationQuota, fetchItinerary, isUnbilledBlocked } from '@/lib/data/itineraryService';
import { archiveTripChat } from '@/lib/data/tripChatService';
import { isEnrichValidationError, enrichErrorFocus } from '@/lib/constants/enrichErrors';
import { ACTIVE_CHAT_KEY, ACTIVE_JOB_KEY, NEW_TRIP_JOB_KEY } from '@/lib/constants/newTrip';
import ErrorState from '@/components/common/ErrorState';
import { ROUTES } from '@/lib/routes';
import { displayName } from '@/lib/utils/placeName';

/** step-stream 이벤트의 스텝(확정 뼈대). 백엔드 { name, nameKo, startTime, category }. */
interface StreamStep {
  name: string;
  nameKo?: string | null;
  startTime: string | null;
  category: string | null;
}

const STAGES: { key: string; label: string }[] = [
  { key: 'select', label: '장소 선별' },
  { key: 'route', label: '동선 최적화' },
  { key: 'time', label: '시간 배분' },
  { key: 'budget', label: '예산 정리' },
];

const SESSION_KEY = ACTIVE_JOB_KEY;

/** 대화 확인 화면이 막 시작한 작업. 한 번 읽으면 지운다. */
function takeNewJob(): { jobId: string; days: number; chatId: string | null } | null {
  try {
    const raw = sessionStorage.getItem(NEW_TRIP_JOB_KEY);
    sessionStorage.removeItem(NEW_TRIP_JOB_KEY);
    const job = raw ? (JSON.parse(raw) as { jobId?: unknown; days?: unknown; chatId?: unknown }) : null;
    if (!job || typeof job.jobId !== 'string') return null;
    return {
      jobId: job.jobId,
      days: typeof job.days === 'number' ? job.days : 3,
      chatId: typeof job.chatId === 'string' ? job.chatId : null,
    };
  } catch {
    return null;
  }
}

// 서버 heartbeat는 SSE 주석이라 EventSource에 보이지 않는다. fallback 경로의 Sonnet 호출 하나가
// 2분 가까이 진행 이벤트 없이 걸릴 수 있어 그보다 길게 잡는다.
const STALL_TIMEOUT_MS = 150_000;
const MAX_RECONNECT_ATTEMPTS = 3;
const ESTIMATE_SEC = 60;

// 최적화 경로와 fallback 경로가 서로 다른 stage 문자열을 보내므로 둘 다 4단계 칩으로 매핑한다.
const STAGE_BUCKET: Record<string, number> = {
  ENRICHING: 0,
  SEARCHING: 0,
  FALLBACK: 0,
  SYNCING: 0,
  SELECTING: 0,
  GENERATING: 0,
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

// 백엔드가 보내는 퍼센트 값(최적화 경로 + fallback 경로 합집합).
const KNOWN_PERCENTAGES = [10, 20, 30, 35, 50, 65, 70, 80, 90, 100];

function getNextTarget(current: number): number {
  for (const t of KNOWN_PERCENTAGES) {
    if (t > current) return t;
  }
  return 100;
}

const stageMessages: Record<string, string> = {
  ENRICHING: '어떤 장소가 어울릴지 분석하고 있어요',
  SEARCHING: '어울리는 장소를 찾고 있어요',
  FALLBACK: '다른 방식으로 장소를 다시 찾고 있어요',
  GENERATING: '최적의 장소를 고르고 있어요',
  SYNCING: '최신 장소 정보를 확인하고 있어요',
  SELECTING: '일자별로 장소를 배치하고 있어요',
  OPTIMIZING: '동선과 이동 시간을 다듬고 있어요',
  VALIDATING: '시간 배분과 동선을 검증하고 있어요',
  SAVING: '예산을 정리하고 일정을 저장하고 있어요',
  COMPLETE: '일정이 완성됐어요!',
};

export default function LoadingScreen() {
  const router = useRouter();
  const { setCurrentItinerary } = useItineraryStore();
  const { display: progress, setTarget } = useSmoothedProgress();
  const [stage, setStage] = useState('ENRICHING');
  const [error, setError] = useState<string | null>(null);
  // "조건 수정"으로 돌아갈 때 강조할 항목을 정한다(UNREALISTIC_BUDGET 등).
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [streamedDays, setStreamedDays] = useState<Record<number, StreamStep[]>>({});
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const startedRef = useRef(false);
  // 화면을 떠난 뒤 늦게 온 완료 이벤트가 사용자를 상세 화면으로 끌고 가지 않게 한다.
  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => { aliveRef.current = false; };
  }, []);
  const esRef = useRef<EventSource | null>(null);
  // complete 뒤 브라우저 재연결이 onerror를 발화시키므로 완료 여부를 기억한다.
  const completedRef = useRef(false);
  // 새로고침 재연결로 일수를 모르면 3열로 그린다.
  const dayCountRef = useRef(3);
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 진행 중 작업을 놓친 경우(재연결·응답 없음) 서버에서 끝나 저장됐을 수 있어 목록으로 안내한다
  const [lostJob, setLostJob] = useState(false);
  // 저장 관문 거부(PLANNING_011)로 미차감 한도에 닿으면 확인 화면으로 보내도 만들 수 없다. null은 확인 중이다.
  const [retryBlocked, setRetryBlocked] = useState<boolean | null>(false);
  const reconnectAttemptsRef = useRef(0);
  const [overEstimate, setOverEstimate] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    const e = setTimeout(() => setOverEstimate(true), ESTIMATE_SEC * 1000);
    return () => { clearTimeout(t); clearTimeout(e); };
  }, []);

  useEffect(() => () => { if (stallTimerRef.current) clearTimeout(stallTimerRef.current); }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const run = () => {
      const job = takeNewJob();
      if (job) {
        dayCountRef.current = Math.min(Math.max(job.days, 1), 3);
        // 새로고침 시 재연결에 쓴다.
        sessionStorage.setItem(SESSION_KEY, job.jobId);
        if (job.chatId) sessionStorage.setItem(ACTIVE_CHAT_KEY, job.chatId);
        else sessionStorage.removeItem(ACTIVE_CHAT_KEY);
        connectToJob(job.jobId);
        return;
      }

      const savedJobId = sessionStorage.getItem(SESSION_KEY);
      if (savedJobId) {
        setLostJob(true);
        reconnectToJob(savedJobId);
        return;
      }
      router.replace(ROUTES.newTrip);
    };

    // 개발 모드 StrictMode는 effect를 바로 정리했다가 다시 부른다. 정리 뒤에 연결해야 방금 연 스트림이 닫히지 않는다.
    void Promise.resolve().then(run);
    return () => { esRef.current?.close(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function reconnectToJob(jobId: string) {
    fetch(`/api/proxy/itineraries/generate/${jobId}/result`, { credentials: 'include' })
      .then(async (res) => {
        if (res.ok) {
          const body = await res.json() as { success: boolean; data: number };
          if (body.success) {
            await handleComplete(jobId, body.data);
            return;
          }
        }
        // 404면 아직 진행 중이다.
        connectToJob(jobId);
      })
      .catch(() => {
        connectToJob(jobId);
      });
  }

  function clearStallTimer() {
    if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
    stallTimerRef.current = null;
  }

  function armStallTimer(jobId: string, eventSource: EventSource) {
    clearStallTimer();
    stallTimerRef.current = setTimeout(async () => {
      if (completedRef.current) return;
      completedRef.current = true;
      eventSource.close();
      try {
        const res = await fetch(`/api/proxy/itineraries/generate/${jobId}/result`, { credentials: 'include' });
        if (res.ok) {
          const body = await res.json() as { success: boolean; data: number };
          if (body.success) {
            await handleComplete(jobId, body.data);
            return;
          }
        }
      } catch { /* 아래 안내로 */ }
      sessionStorage.removeItem(SESSION_KEY);
      setLostJob(true);
      setError('서버 응답이 오래 없어요. 일정이 완성되면 내 여행에 저장돼요.');
    }, STALL_TIMEOUT_MS);
  }

  function connectToJob(jobId: string) {
    completedRef.current = false;
    const sseUrl = `/api/proxy/itineraries/generate/${jobId}/stream`;
    const eventSource = new EventSource(sseUrl, { withCredentials: true });
    esRef.current = eventSource;
    armStallTimer(jobId, eventSource);

    eventSource.addEventListener('progress', (e) => {
      armStallTimer(jobId, eventSource);
      const payload = JSON.parse(e.data) as { percentage: number; message: string; stage: string };
      setTarget(payload.percentage);
      setStage(payload.stage);
    });

    eventSource.addEventListener('step-stream', (e) => {
      armStallTimer(jobId, eventSource);
      try {
        const payload = JSON.parse((e as MessageEvent).data) as { dayNumber: number; steps: StreamStep[] };
        if (payload?.dayNumber && Array.isArray(payload.steps)) {
          setStreamedDays((prev) => ({ ...prev, [payload.dayNumber]: payload.steps }));
        }
      } catch { /* 잘못된 페이로드 무시 */ }
    });

    // complete는 구조 일정이 확정된 시점이고 story는 결과 화면에서 비동기로 채워지므로 바로 이동한다.
    eventSource.addEventListener('complete', async () => {
      completedRef.current = true;
      clearStallTimer();
      setTarget(100);
      setStage('COMPLETE');

      // fetch/json은 네트워크 단절 시 throw하므로 감싸지 않으면 unhandled rejection이 난다.
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

    // story 이벤트가 화면 전환 전에 먼저 도착할 때를 위한 정리용 리스너.
    eventSource.addEventListener('story-ready', () => {
      eventSource.close();
    });
    eventSource.addEventListener('story-failed', () => {
      eventSource.close();
    });

    eventSource.addEventListener('error', (e) => {
      // 연결 끊김도 'error' 이름으로 들어오므로 본문 있는 서버 이벤트만 여기서 처리하고
      // 끊김은 onerror의 재연결로 넘긴다.
      if (!(e instanceof MessageEvent) || !e.data) return;
      completedRef.current = true;
      clearStallTimer();
      eventSource.close();
      let payload: { message?: string; errorCode?: string } | null = null;
      try {
        const raw = (e as MessageEvent).data;
        if (raw) payload = JSON.parse(raw);
      } catch { /* 본문이 JSON이 아니면 기본 문구 */ }
      setError(payload?.message ?? '일정 생성 중 오류가 발생했습니다.');
      setErrorCode(payload?.errorCode ?? null);
      // 서버가 작업을 모르면(재배포·만료) 이미 저장됐을 수 있어 목록으로 안내한다.
      if (payload?.errorCode === 'PLANNING_006') setLostJob(true);
      if (payload?.errorCode === 'PLANNING_011') {
        setRetryBlocked(null);
        void fetchGenerationQuota()
          .then((q) => { if (aliveRef.current) setRetryBlocked(isUnbilledBlocked(q)); })
          .catch(() => { if (aliveRef.current) setRetryBlocked(false); });
      }
      sessionStorage.removeItem(SESSION_KEY);
    });

    // 서버 complete 후 브라우저가 재연결을 시도할 때도 발화한다.
    eventSource.onerror = () => {
      if (completedRef.current) return;
      clearStallTimer();
      eventSource.close();
      // 서버는 작업을 계속 돌리고 다시 붙으면 기록을 재전송한다. 바로 실패로 끝내면 사용자가
      // "다시 시도"로 같은 일정을 한 번 더 생성해 쿼터를 두 번 쓴다.
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current += 1;
        setTimeout(() => reconnectToJob(jobId), 1500 * reconnectAttemptsRef.current);
        return;
      }
      setLostJob(true);
      setError('서버 연결이 끊어졌습니다. 다시 시도해주세요.');
      sessionStorage.removeItem(SESSION_KEY);
    };
  }

  async function handleComplete(jobId: string, itineraryId: number) {
    try {
      const itinerary = await fetchItinerary(itineraryId);
      setCurrentItinerary(itinerary);
      // 일정을 만든 대화만 보관한다. 그 사이 다른 탭에서 시작한 새 대화는 건드리지 않는다.
      const chatId = sessionStorage.getItem(ACTIVE_CHAT_KEY);
      if (chatId) void archiveTripChat(chatId).catch(() => {});
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(ACTIVE_CHAT_KEY);
      if (!aliveRef.current) return;
      setFadeOut(true);
      setTimeout(() => router.push(ROUTES.trip(itineraryId)), 600);
    } catch {
      setError('일정을 불러오는데 실패했습니다.');
    }
  }

  if (error) {
    // 차단·쿼터 초과(PLANNING_003/004)와 미차감 한도에 닿은 거부는 재시도해도 소용없어 "확인"만 둔다.
    const isBlocked = errorCode === 'PLANNING_003' || errorCode === 'PLANNING_004' || retryBlocked === true;
    // 입력 검증 실패는 "조건 수정"으로 해당 항목을, 그 외는 "다시 시도"로 확인 화면을 연다. 대화 내용은 서버에 남아 있다.
    const isValidationError = isEnrichValidationError(errorCode);
    const focus = isValidationError ? enrichErrorFocus(errorCode) : null;
    return (
      <div className="flex min-h-[65vh] items-center justify-center px-4">
        <ErrorState
          className="w-full max-w-sm"
          description={error}
          errorCode={errorCode ?? undefined}
          retryLabel={isValidationError ? '조건 수정' : '다시 시도'}
          onRetry={isBlocked || retryBlocked === null ? undefined : () => router.push(`${ROUTES.newTrip}${focus ? `?focus=${focus.toLowerCase()}` : ''}`)}
          secondaryLabel={isBlocked ? '확인' : lostJob ? '내 여행 보기' : '처음으로'}
          onSecondary={() => router.push(ROUTES.trips)}
        />
      </div>
    );
  }

  const clampedProgress = Math.min(progress, 100);
  const currentStageIdx = getStageIndex(stage);
  const dayCount = dayCountRef.current;

  return (
    <div
      className={`mx-auto flex min-h-[65vh] w-full max-w-[632px] flex-col justify-center px-4 py-8 transition-[opacity,transform] duration-700 ease-out ${
        fadeOut ? 'opacity-0 scale-95' : visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 translate-y-4'
      }`}
    >
      {/* 로딩 장식을 늘리지 않고 실제 진행률 바 하나로 진행을 보여준다. */}
      <div className="mb-5 text-center">
        <div className="text-[23px] font-extrabold tracking-[-0.02em] text-foreground">
          일정을 짜고 있어요
        </div>
        <div className="mt-1.5 text-[13px] text-muted">
          {stageMessages[stage] ?? stageMessages.ENRICHING} · {overEstimate ? '조금 더 걸리고 있어요' : '약 1분'}
        </div>
        <div className="mx-auto mt-3.5 flex w-[200px] items-center gap-2.5">
          <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
              style={{ width: `${clampedProgress}%` }}
            />
          </div>
          <span className="w-[34px] shrink-0 text-left text-xs font-bold tabular-nums text-muted-2">
            {clampedProgress}%
          </span>
        </div>
      </div>

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

      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${dayCount}, 1fr)` }}
      >
        {Array.from({ length: dayCount }, (_, d) => {
          const daySteps = streamedDays[d + 1];
          return (
            <div key={d} className="flex flex-col gap-2">
              <div
                className={`text-xs font-extrabold ${
                  d === 0 ? 'text-accent-weak-fg' : 'text-muted-2'
                }`}
              >
                Day {d + 1}
              </div>
              {daySteps
                ? daySteps.slice(0, 5).map((step, r) => (
                    <div
                      key={r}
                      className="flex min-h-[52px] animate-[shg-fade-in_0.4s_ease-out] flex-col justify-center gap-0.5 rounded-[10px] border border-card-border bg-card-bg px-3 py-2"
                    >
                      <div className="truncate text-xs font-bold text-foreground">{displayName(step)}</div>
                      <div className="truncate text-xs font-semibold text-muted-2">
                        {step.startTime ?? ''}
                        {step.startTime && step.category ? ' · ' : ''}
                        {step.category ?? ''}
                      </div>
                    </div>
                  ))
                : [0, 1, 2].map((r) => (
                    // 실카드와 같은 껍데기(min-h-52 / rounded-10 / border / card-bg / px-3 py-2)라
                    // 도착하면 바 → 글자만 바뀌고 레이아웃은 안 움직인다.
                    <div
                      key={r}
                      className="flex min-h-[52px] flex-col justify-center gap-1.5 rounded-[10px] border border-card-border bg-card-bg px-3 py-2"
                    >
                      <div
                        className="h-[9px] w-[72%] rounded-full shg-shimmer"
                        style={{ animationDelay: `${(d * 0.15 + r * 0.2) % 0.6}s` }}
                      />
                      <div
                        className="h-[7px] w-[42%] rounded-full shg-shimmer"
                        style={{ animationDelay: `${(d * 0.15 + r * 0.2 + 0.1) % 0.6}s` }}
                      />
                    </div>
                  ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
