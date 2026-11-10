import Logo from '@/components/common/Logo';

/** "SHG trip" 화자 표시와 흰 말풍선 카드. 질문·보조 설명·예시·입력창이 한 카드에 들어간다. */
export default function SpeakerCard({ children, labelledBy }: { children: React.ReactNode; labelledBy: string }) {
  return (
    <section aria-labelledby={labelledBy}>
      <div className="mb-2.5 flex items-center gap-2 px-[3px] text-xs text-muted">
        <Logo size={22} radiusClassName="rounded-lg" />
        <span>SHG trip</span>
      </div>
      <div className="shg-turn-in rounded-[5px_21px_21px_21px] border border-card-border bg-card-bg px-5 pb-[18px] pt-[23px] sm:px-[26px] sm:pt-[25px]">
        {children}
      </div>
    </section>
  );
}
