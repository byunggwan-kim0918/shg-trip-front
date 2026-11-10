import Logo from '@/components/common/Logo';

/** 보낸 답을 정리하는 동안 다음 질문 자리에 보이는 말풍선. 실제 요청 중에만 나타난다. */
export default function ThinkingBubble() {
  return (
    <div className="shg-turn-in" style={{ animationDelay: '160ms' }}>
      <div className="mb-2.5 flex items-center gap-2 px-[3px] text-xs text-muted">
        <Logo size={22} radiusClassName="rounded-lg" />
        <span>SHG trip</span>
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-[5px_21px_21px_21px] border border-card-border bg-card-bg px-5 py-[18px]">
        <span className="sr-only">답변을 정리하고 있어요</span>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            aria-hidden="true"
            className="size-1.5 rounded-full bg-muted-2 motion-safe:[animation:shg-blink_1.2s_ease-in-out_infinite]"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  );
}
