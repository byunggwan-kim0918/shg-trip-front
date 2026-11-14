import { Info } from 'lucide-react';
import type { ParsedNotice } from '@/lib/utils/qualityNotices';

/** 알림이 전부 일차 단위라 헤더가 아니라 그날 첫 스톱 위에 두고, 하루치는 1~2줄이라 접지 않는다. */
export default function QualityNotices({ items }: { items: ParsedNotice[] }) {
  if (items.length === 0) return null;

  return (
    <div className="mb-4 rounded-[10px] border border-warn-border bg-warn-bg px-3 py-2.5 text-xs">
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={`${item.text}-${i}`} className="flex items-start gap-1.5 font-semibold text-text-2">
            <Info size={12} className="mt-[2px] shrink-0 text-warn-fg" aria-hidden="true" />
            <span className="min-w-0">
              {item.text}
              {/* 할 일은 항목마다 달라 해당 항목 바로 뒤에 둔다. */}
              {item.followUp && <span className="font-medium text-muted"> · {item.followUp}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
