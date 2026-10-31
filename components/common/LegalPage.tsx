import Link from 'next/link';
import Logo from '@/components/common/Logo';

/** 개인정보 문의처. 실제로 받는 주소로 바꿔야 한다. */
export const LEGAL_CONTACT_EMAIL = 'contact@shg-trip.cloud';

export interface LegalSection {
  title: string;
  body: React.ReactNode;
}

export default function LegalPage({
  title,
  effectiveDate,
  intro,
  sections,
}: {
  title: string;
  effectiveDate: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <div className="min-h-[100dvh] bg-background px-4 py-10 sm:py-16">
      <article className="mx-auto w-full max-w-[720px]">
        <Link href="/" aria-label="홈으로" className="inline-block">
          <Logo size={36} />
        </Link>
        <h1 className="mt-6 text-[26px] font-extrabold tracking-[-0.02em] text-foreground">{title}</h1>
        <p className="mt-1 text-xs text-muted-2 tabular-nums">시행일 {effectiveDate}</p>
        <p className="mt-5 text-sm leading-relaxed text-text-2">{intro}</p>

        <div className="mt-8 space-y-8">
          {sections.map((s, i) => (
            <section key={s.title}>
              <h2 className="text-[15px] font-bold text-foreground">
                제{i + 1}조 {s.title}
              </h2>
              <div className="mt-2 space-y-2 text-sm leading-relaxed text-text-2 [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1">
                {s.body}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 flex gap-4 border-t border-card-border pt-6 text-xs text-muted">
          <Link href="/terms" className="hover:text-foreground">이용약관</Link>
          <Link href="/privacy" className="hover:text-foreground">개인정보처리방침</Link>
          <Link href="/" className="ml-auto hover:text-foreground">홈으로</Link>
        </div>
      </article>
    </div>
  );
}
