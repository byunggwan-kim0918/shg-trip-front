import { Info } from 'lucide-react';
import type { ParsedNotice } from '@/lib/utils/qualityNotices';

/**
 * 선택된 Day의 품질 알림(생성 시 끝내 채우지 못한 숙소·식사 등).
 *
 * 알림이 전부 일차 단위라 헤더가 아니라 그날 첫 스톱 위에 둔다. 하루치는 1~2줄이라 접지 않는다.
 */
export default function QualityNotices({ items }: { items: ParsedNotice[] }) {
  if (items.length === 0) return null;

  // 식사 누락 등은 같은 원인 문장을 공유한다. 항목마다 반복하지 않고 한 번만 보인다.
  const causes = [...new Set(items.map((i) => i.cause).filter((c): c is string => c != null))];

  return (
    <div className="mb-4 rounded-[10px] border border-warn-border bg-warn-bg px-3 py-2.5 text-xs">
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={`${item.text}-${i}`} className="flex items-start gap-1.5 font-semibold text-text-2">
            <Info size={12} className="mt-[2px] shrink-0 text-warn-fg" aria-hidden="true" />
            <span className="min-w-0">{item.text}</span>
          </li>
        ))}
      </ul>
      {causes.length > 0 && (
        <p className="mt-1 pl-[18px] text-muted">{causes.join(' · ')}</p>
      )}
    </div>
  );
}
