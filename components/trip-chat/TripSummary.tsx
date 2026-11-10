'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import AnswerComposer from '@/components/trip-chat/AnswerComposer';
import ExampleChips from '@/components/trip-chat/ExampleChips';
import SpeakerCard from '@/components/trip-chat/SpeakerCard';
import GenerationQuotaBadge from '@/components/itinerary/GenerationQuotaBadge';
import type { GenerationQuota } from '@/lib/data/itineraryService';
import type { FailedAnswer, OutgoingAnswer } from '@/lib/tripChat/reducer';
import type { TripChat, TripChatFix, TripChatSlot } from '@/lib/types/tripChat';
import { ROUTES } from '@/lib/routes';

const EXTRA_QUESTION_ID = 'extra';

interface Props {
  chat: TripChat;
  focusSlot: TripChatSlot | null;
  sending: OutgoingAnswer | null;
  failed: FailedAnswer | null;
  busy: boolean;
  /** 확인이 끝나 생성 화면으로 넘어가는 중 */
  launching: boolean;
  /** 이 브라우저에서 생성 화면이 연결 중인 작업이 있다 */
  activeJob: boolean;
  notice: string | null;
  quota: GenerationQuota | null;
  canGenerate: boolean;
  onEdit: (slot: TripChatSlot) => void;
  onSend: (questionId: string, text: string) => Promise<boolean>;
  onConfirm: () => void;
}

export default function TripSummary({
  chat, focusSlot, sending, failed, busy, launching, activeJob, notice, quota, canGenerate, onEdit, onSend, onConfirm,
}: Props) {
  const fix = chat.summary.fixes[0] ?? null;
  const confirmed = chat.status === 'CONFIRMED' && !launching;
  const working = busy || launching || sending !== null;
  const focusRowRef = useRef<HTMLDivElement>(null);
  const focusEditRef = useRef<HTMLButtonElement>(null);
  // 추가 조건을 보내 바뀐 행만 잠깐 칠해 어디에 반영됐는지 보이게 한다.
  const [firstValues] = useState(() => new Map(chat.summary.rows.map((r) => [r.slot, r.value])));

  // 생성 화면의 "조건 수정"으로 돌아오면 그 항목을 보이고 수정 버튼에 포커스한다.
  useEffect(() => {
    focusRowRef.current?.scrollIntoView({ block: 'center' });
    focusEditRef.current?.focus({ preventScroll: true });
  }, [focusSlot]);

  return (
    <SpeakerCard labelledBy="question-title">
      <p className="mb-2 text-[13px] leading-[1.6] text-muted sm:text-sm">우리, 이렇게 이야기했어요</p>
      <h1 id="question-title" className="text-[21px] font-[650] leading-[1.5] tracking-[-0.7px] text-foreground sm:text-[23px]">
        생각한 여행이 맞나요?
      </h1>
      <p className="mt-[9px] text-[13px] leading-[1.7] text-muted">다르게 이해한 부분이 있다면 편하게 고쳐주세요.</p>
      {confirmed && (
        <p className="mt-3 rounded-[10px] bg-surface-3 px-3.5 py-2.5 text-xs leading-[1.6] text-muted">
          이 내용으로 일정을 만든 적이 있어요. 다시 만들면 생성 횟수를 한 번 더 써요.
          {activeJob && (
            <Link href={ROUTES.generating} className="ml-1.5 font-semibold text-accent-weak-fg underline underline-offset-4">
              만들고 있는 일정 보기
            </Link>
          )}
        </p>
      )}

      <dl className="mt-[23px]">
        {chat.summary.rows.map((row, i) => {
          const focused = row.slot === focusSlot;
          const changed = firstValues.get(row.slot) !== row.value;
          return (
            <div
              key={`${row.slot}|${row.value}`}
              ref={focused ? focusRowRef : undefined}
              style={changed ? undefined : { animationDelay: `${120 + i * 40}ms` }}
              className={`grid grid-cols-[52px_minmax(0,1fr)_auto] items-start gap-[11px] border-b border-card-border py-4 text-[13px] first:pt-0 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:gap-[15px] ${
                changed ? 'shg-row-changed rounded-sm' : 'shg-rise-in'
              } ${focused ? 'rounded-lg bg-accent-soft/50 px-2' : ''}`}
            >
              <dt className="pt-px text-[13px] text-muted">{row.label}</dt>
              <dd className="min-w-0 text-foreground [overflow-wrap:anywhere]">
                {row.value}
                {row.notes.map((note) => (
                  <span key={note} className="mt-[3px] block text-xs leading-[1.7] text-muted">{note}</span>
                ))}
              </dd>
              <dd>
                <button
                  ref={focused ? focusEditRef : undefined}
                  type="button"
                  onClick={() => onEdit(row.slot)}
                  disabled={working}
                  aria-label={`${row.label} 수정`}
                  className="py-0.5 text-xs text-muted transition-colors hover:text-accent-weak-fg disabled:opacity-40 pointer-coarse:min-h-11 pointer-coarse:min-w-11"
                >
                  수정
                </button>
              </dd>
            </div>
          );
        })}
      </dl>

      {fix && (
        <FixBlock
          key={`${fix.questionId}:${failed?.questionId === fix.questionId ? failed.clientTurnId : ''}`}
          fix={fix}
          sending={sending?.questionId === fix.questionId ? sending : null}
          failed={failed?.questionId === fix.questionId ? failed : null}
          disabled={working}
          onSend={(text) => onSend(fix.questionId, text)}
        />
      )}

      <ExtraConditions
        key={failed?.questionId === EXTRA_QUESTION_ID ? failed.clientTurnId : 'extra'}
        initiallyOpen={focusSlot === 'EXTRAS'}
        sending={sending?.questionId === EXTRA_QUESTION_ID ? sending : null}
        failed={failed?.questionId === EXTRA_QUESTION_ID ? failed : null}
        disabled={working}
        onSend={(text) => onSend(EXTRA_QUESTION_ID, text)}
      />

      <p className="mt-[23px] border-t border-card-border pt-[15px] text-[11px] leading-[1.7] text-muted">
        말하지 않은 조건은 미정으로 남겨둬요.<br />추가하고 싶은 내용이 있다면 위에서 편하게 알려주세요.
      </p>

      {quota && (
        <div className="mt-4 flex justify-center">
          <GenerationQuotaBadge quota={quota} />
        </div>
      )}
      <button
        type="button"
        onClick={onConfirm}
        disabled={!chat.summary.ready || !canGenerate || working}
        aria-busy={launching}
        className="mt-[19px] flex min-h-12 w-full items-center justify-between gap-3 rounded-[10px] bg-accent px-[17px] text-sm font-[650] text-accent-fg transition-[filter,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
      >
        {launching ? '일정 만들기를 시작하고 있어요' : confirmed ? '이 내용으로 다시 만들기' : '이 내용으로 일정 만들기'}
        <ArrowRight size={19} aria-hidden="true" />
      </button>
      {notice && (
        <p role="alert" className="mt-2.5 text-center text-xs leading-[1.6] text-danger">{notice}</p>
      )}
    </SpeakerCard>
  );
}

function FixBlock({ fix, sending, failed, disabled, onSend }: {
  fix: TripChatFix;
  sending: OutgoingAnswer | null;
  failed: FailedAnswer | null;
  disabled: boolean;
  onSend: (text: string) => Promise<boolean>;
}) {
  const [text, setText] = useState(failed?.text ?? '');
  return (
    <div className="mt-[19px] rounded-xl bg-surface-3 px-4 py-4">
      <p className="text-[15px] font-semibold text-foreground">{fix.title}</p>
      <p className="mt-1 text-xs leading-[1.7] text-muted">{fix.description}</p>
      <div className="mt-3">
        {!sending && <ExampleChips examples={fix.examples} onPick={setText} />}
        <AnswerComposer
          value={sending ? sending.display : text}
          onChange={setText}
          onSubmit={() => {
            const value = text.trim();
            setText('');
            void onSend(value);
          }}
          placeholder={fix.placeholder ?? '편하게 답해주세요'}
          label={fix.title}
          disabled={disabled}
          hint={sending ? '답변을 정리하고 있어요' : null}
          sendLabel="보내기"
        />
        {failed && <p role="alert" className="mt-2 text-xs text-danger">{failed.message}</p>}
      </div>
    </div>
  );
}

function ExtraConditions({ initiallyOpen, sending, failed, disabled, onSend }: {
  initiallyOpen: boolean;
  sending: OutgoingAnswer | null;
  failed: FailedAnswer | null;
  disabled: boolean;
  onSend: (text: string) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(initiallyOpen || failed !== null);
  const [text, setText] = useState(failed?.text ?? '');
  return (
    <details className="mt-[19px]" open={open || sending !== null} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="cursor-pointer py-2 text-[13px] text-muted marker:text-muted pointer-coarse:min-h-11">
        더 알려주고 싶은 게 있어요
      </summary>
      {(open || sending !== null) && <div className="shg-rise-in pt-2">
        <p className="mb-2.5 text-xs text-muted">예산, 도착 시간, 피할 음식 등 무엇이든</p>
        <AnswerComposer
          value={sending ? sending.display : text}
          onChange={setText}
          onSubmit={() => {
            const value = text.trim();
            setText('');
            void onSend(value);
          }}
          placeholder="예: 첫날 오후 3시에 도착해. 해산물은 못 먹어."
          label="더 알려줄 내용"
          disabled={disabled}
          hint={sending ? '답변을 정리하고 있어요' : '보내면 위 요약에 정리돼요.'}
          sendLabel="추가 조건 보내기"
        />
        {failed && <p role="alert" className="mt-2 text-xs text-danger">{failed.message}</p>}
      </div>}
    </details>
  );
}
