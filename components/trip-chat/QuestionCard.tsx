'use client';

import { useEffect, useRef, useState } from 'react';
import AnswerComposer, { type AnswerComposerHandle } from '@/components/trip-chat/AnswerComposer';
import ExampleChips from '@/components/trip-chat/ExampleChips';
import SpeakerCard from '@/components/trip-chat/SpeakerCard';
import type { FailedAnswer } from '@/lib/tripChat/reducer';
import type { TripChatAnswerKind, TripChatQuestion } from '@/lib/types/tripChat';

interface Props {
  question: TripChatQuestion;
  failed: FailedAnswer | null;
  disabled: boolean;
  onSend: (kind: TripChatAnswerKind, text: string | null) => void;
}

const quietButton =
  'whitespace-nowrap py-0.5 text-[11px] text-muted underline underline-offset-4 transition-colors hover:text-foreground disabled:opacity-40 pointer-coarse:min-h-11';

export default function QuestionCard({ question, failed, disabled, onSend }: Props) {
  const failedHere = failed && failed.questionId === question.id ? failed : null;
  const [text, setText] = useState(() => failedHere?.text ?? question.prefill ?? '');
  const [examplesOpen, setExamplesOpen] = useState(question.examplesOpen);
  const composerRef = useRef<AnswerComposerHandle>(null);

  // 데스크톱에서만 새 질문 입력창에 포커스한다. 모바일은 키보드가 바로 올라와 질문을 가린다.
  useEffect(() => {
    if (window.matchMedia('(pointer: fine)').matches) composerRef.current?.focus();
  }, [question.id]);

  const busy = disabled;
  const canToggleExamples = question.examples.length > 0 && !question.examplesOpen;
  const tool = question.tool === 'UNKNOWN' ? { kind: 'unknown' as const, label: '아직 모르겠어요' }
    : question.tool === 'NONE' ? { kind: 'none' as const, label: '정해둔 건 없어요' } : null;

  const submit = () => {
    const value = text.trim();
    if (!value || busy) return;
    setText('');
    onSend('text', value);
  };

  return (
    <SpeakerCard labelledBy="question-title">
      {question.lead && (
        <p className="shg-rise-in mb-2 text-[13px] leading-[1.6] text-muted sm:text-sm" style={{ animationDelay: '40ms' }}>
          {question.lead}
        </p>
      )}
      <h1
        id="question-title"
        className="shg-rise-in text-[21px] font-[650] leading-[1.5] tracking-[-0.7px] text-foreground sm:text-[23px]"
        style={{ animationDelay: '80ms' }}
      >
        {question.title}
      </h1>
      {question.description && (
        <p className="shg-rise-in mt-[9px] text-[13px] leading-[1.7] text-muted" style={{ animationDelay: '120ms' }}>
          {question.description}
        </p>
      )}

      <div className="shg-rise-in mt-[23px]" style={{ animationDelay: '160ms' }}>
        {examplesOpen && !busy && (
          <ExampleChips
            examples={question.examples}
            onPick={(example) => {
              setText(example);
              composerRef.current?.focus();
            }}
          />
        )}
        <AnswerComposer
          ref={composerRef}
          value={text}
          onChange={setText}
          onSubmit={submit}
          placeholder={question.placeholder ?? '편하게 답해주세요'}
          label="답변"
          disabled={busy}
        />
        {failedHere && (
          <p role="alert" className="mt-2 text-xs leading-[1.6] text-danger">
            {failedHere.message}
          </p>
        )}
        <div className="mt-3 flex min-h-5 items-center justify-between gap-3">
          {canToggleExamples ? (
            <button type="button" className={quietButton} disabled={busy} onClick={() => setExamplesOpen((v) => !v)}>
              {examplesOpen ? '예시 접기' : '막막하면 예시 보기'}
            </button>
          ) : <span />}
          {tool && (
            <button type="button" className={quietButton} disabled={busy} onClick={() => onSend(tool.kind, null)}>
              {tool.label}
            </button>
          )}
        </div>
      </div>
    </SpeakerCard>
  );
}
