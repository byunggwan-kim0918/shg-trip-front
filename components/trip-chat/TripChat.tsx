'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, List } from 'lucide-react';
import ErrorState from '@/components/common/ErrorState';
import PreviousExchange from '@/components/trip-chat/PreviousExchange';
import QuestionCard from '@/components/trip-chat/QuestionCard';
import TripSummary from '@/components/trip-chat/TripSummary';
import ThinkingBubble from '@/components/trip-chat/ThinkingBubble';
import HistoryModal from '@/components/trip-chat/HistoryModal';
import GenerationQuotaBadge from '@/components/itinerary/GenerationQuotaBadge';
import { useTripChat } from '@/lib/hooks/useTripChat';
import { useGenerationQuota } from '@/lib/hooks/useGenerationQuota';
import { ACTIVE_JOB_KEY, NEW_TRIP_JOB_KEY } from '@/lib/constants/newTrip';
import type { TripChatExchange, TripChatSlot } from '@/lib/types/tripChat';

const quietButton =
  'inline-flex items-center gap-[7px] whitespace-nowrap py-[5px] text-xs text-muted transition-colors hover:text-foreground disabled:opacity-40 pointer-coarse:min-h-11';

export default function TripChat({ focusSlot }: { focusSlot: TripChatSlot | null }) {
  const router = useRouter();
  const { state, resumed, send, goBack, edit, restart, confirm } = useTripChat();
  const { quota, canGenerate, refetch } = useGenerationQuota();
  const [historyOpen, setHistoryOpen] = useState(false);
  // 확인 성공 뒤 화면을 옮기기 전까지 버튼이 다시 켜지면 같은 조건으로 생성이 한 번 더 시작된다.
  const [launching, setLaunching] = useState(false);
  const [activeJob] = useState(() => {
    try {
      return typeof window !== 'undefined' && !!sessionStorage.getItem(ACTIVE_JOB_KEY);
    } catch {
      return false;
    }
  });
  const { chat, sending, failed, busy, notice } = state;

  const screenKey = chat ? `${chat.status}:${chat.question?.id ?? ''}` : '';
  const keepFocusScroll = !!focusSlot && chat?.status !== 'ASKING';
  useEffect(() => {
    // 앱 화면은 <main>이 스크롤된다. 질문이 바뀌면 새 카드가 보이게 위로 올린다.
    if (!keepFocusScroll) document.querySelector('main')?.scrollTo({ top: 0 });
  }, [screenKey, keepFocusScroll]);

  if (state.phase === 'loading') {
    return (
      <div className="mx-auto w-full max-w-[680px] pt-2" aria-busy="true" aria-label="대화를 불러오는 중">
        <div className="mb-7 h-[30px]" />
        <div className="h-[260px] rounded-[5px_21px_21px_21px] shg-shimmer" />
      </div>
    );
  }
  if (state.phase === 'error' || !chat) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <ErrorState
          className="w-full max-w-sm"
          description={state.loadError ?? '대화를 불러오지 못했어요.'}
          retryLabel="다시 불러오기"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const asking = chat.status === 'ASKING' && chat.question !== null;
  const question = asking ? chat.question : null;
  const sendingHere = question && sending?.questionId === question.id ? sending : null;
  // 보낸 답이 해석되는 동안에는 답한 질문 카드를 남기지 않고 내 답 + 대기 말풍선만 보인다.
  const waitingAnswer = sendingHere?.display ?? (question ? chat.pending : null);
  let exchange: TripChatExchange | null = null;
  if (question && waitingAnswer !== null) exchange = { question: question.title, answer: waitingAnswer };
  else if (question && question.kind !== 'EDIT') exchange = chat.lastExchange;

  const announcement = sending ? '답변을 정리하고 있어요'
    : question ? [question.lead, question.title].filter(Boolean).join(' ')
      : '생각한 여행이 맞나요? 대화 내용을 확인하는 화면이에요.';

  const onConfirm = async () => {
    setLaunching(true);
    const result = await confirm();
    if (result?.jobId) {
      try {
        sessionStorage.setItem(NEW_TRIP_JOB_KEY,
          JSON.stringify({ jobId: result.jobId, days: result.days ?? 3, chatId: result.id }));
      } catch { /* 저장이 막히면 생성 화면이 작업을 찾지 못하고 이 화면으로 돌려보낸다 */ }
      router.push('/main/itinerary/loading');
      return;
    }
    setLaunching(false);
    void refetch();
  };

  return (
    <div className="mx-auto w-full max-w-[680px] pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-1 sm:pt-2">
      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
      <nav aria-label="여행 입력 이동" className="mb-7 flex min-h-[30px] items-center justify-between gap-4">
        {asking && chat.back ? (
          <button type="button" className={quietButton} onClick={() => void goBack()} disabled={busy || !!sending}>
            <ArrowLeft size={15} aria-hidden="true" />
            <span>{chat.back === 'CANCEL' ? '돌아가기' : '이전 답변'}</span>
          </button>
        ) : chat.history.length === 0 ? (
          <span className="text-xs text-muted">우리, 여행 이야기부터 해볼까요?</span>
        ) : <span />}
        <button type="button" className={quietButton} onClick={() => setHistoryOpen(true)}>
          <List size={15} aria-hidden="true" />
          <span>답변 모아보기</span>
        </button>
      </nav>

      {/* 탈퇴 후 재가입해도 생성 횟수는 이어진다. 막힌 계정은 대화를 끝까지 하기 전에 알려야 한다. */}
      {asking && quota && !canGenerate && <GenerationQuotaBadge quota={quota} className="mb-5" />}

      {resumed && (
        <p className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-xs text-muted">
          작성 중이던 여행을 이어서 할게요.
          <button type="button" onClick={() => void restart()} disabled={busy} className="underline underline-offset-4 hover:text-foreground pointer-coarse:min-h-11">
            새로 시작
          </button>
        </p>
      )}

      {question ? (
        <>
          {/* 보내는 중과 응답 뒤의 직전 교환은 같은 답이라 key가 같아 말풍선이 다시 튀어오르지 않는다. */}
          {exchange && <PreviousExchange key={`${exchange.question}|${exchange.answer}`} exchange={exchange} />}
          {waitingAnswer !== null ? (
            <ThinkingBubble />
          ) : (
            <QuestionCard
              key={`${question.id}:${failed?.questionId === question.id ? failed.clientTurnId : ''}`}
              question={question}
              failed={failed}
              disabled={busy}
              onSend={(kind, text) => void send(question.id, kind, text)}
            />
          )}
          {notice && <p role="alert" className="mt-3 px-1 text-xs text-danger">{notice}</p>}
          <p className="mt-[19px] flex items-center justify-center gap-1.5 text-[11px] text-muted">
            <Check size={14} aria-hidden="true" />
            답변은 마지막에 다시 확인하고 바꿀 수 있어요.
          </p>
        </>
      ) : (
        <TripSummary
          chat={chat}
          focusSlot={focusSlot}
          sending={sending}
          failed={failed}
          busy={busy}
          launching={launching}
          activeJob={activeJob}
          notice={notice}
          quota={quota}
          canGenerate={canGenerate}
          onEdit={(slot) => void edit(slot)}
          onSend={(questionId, text) => send(questionId, 'text', text)}
          onConfirm={() => void onConfirm()}
        />
      )}

      <HistoryModal
        open={historyOpen}
        chat={chat}
        busy={busy}
        onClose={() => setHistoryOpen(false)}
        onRestart={() => {
          setHistoryOpen(false);
          void restart();
        }}
      />
    </div>
  );
}
