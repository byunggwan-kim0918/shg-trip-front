import type { TripChatExchange } from '@/lib/types/tripChat';

/** 직전 질문과 내 답만 위에 남긴다. 전체 대화는 "답변 모아보기"에서 본다. */
export default function PreviousExchange({ exchange }: { exchange: TripChatExchange }) {
  return (
    <div className="mb-6">
      <p className="shg-backdrop-in mb-2.5 px-1 text-xs text-muted">{exchange.question}</p>
      <div className="flex justify-end px-1">
        <p className="shg-bubble-in max-w-[91%] whitespace-pre-wrap rounded-[17px_17px_4px_17px] bg-accent px-[15px] py-2.5 text-[13px] text-accent-fg [overflow-wrap:anywhere] sm:max-w-[82%] sm:text-sm">
          {exchange.answer}
        </p>
      </div>
    </div>
  );
}
