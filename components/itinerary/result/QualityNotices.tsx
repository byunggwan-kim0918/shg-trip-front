'use client';

import { useState } from 'react';
import { AlertTriangle, ChevronDown } from 'lucide-react';
import { parseQualityNotices } from '@/lib/utils/qualityNotices';

/**
 * 생성 시 끝내 채우지 못한 항목(숙소·식사 등) 알림.
 *
 * 예전엔 백엔드 문장 배열을 그대로 <li>로 쏟아냈다. 다섯 줄짜리 앰버 덩어리가
 * Day 탭 위에 앉아 정작 일정보다 먼저 읽혔고, 모든 줄이 같은 크기라 훑을 수도 없었다.
 *
 * 이 알림은 **일정을 못 쓰게 만드는 오류가 아니라 단서**다. 그래서 기본은 한 줄로 접는다 —
 * 접힌 상태에서도 개수와 영향받은 일차가 보이므로 사실을 감추지는 않는다(원래 목적:
 * 숙소 없는 일정이 아무 표시 없이 나가던 것을 막는 것).
 */
export default function QualityNotices({ notices }: { notices: string[] }) {
  const [open, setOpen] = useState(false);
  if (notices.length === 0) return null;

  const { items, causes, days } = parseQualityNotices(notices);
  const sorted = [...items].sort((a, b) => (a.day ?? 99) - (b.day ?? 99));

  /* 색을 뺀다. 전면 앰버 띠(bg-warn-bg)는 화면에서 가장 강한 색이었는데 주 정보가 아니고,
     위 SummaryHeader도 border-b로 끝나서 색만 다른 띠가 하나 더 붙은 꼴이었다 —
     그래서 헤더에도 본문에도 속하지 않고 겉도는 것으로 읽혔다.
     보더를 헤더와 같은 card-border로 맞춰 헤더 스택의 한 줄로 만들고,
     경고 색은 아이콘에만 남긴다. 어느 날인지는 Day 탭의 점이 받는다. */
  return (
    <div className="border-b border-card-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs text-muted transition-colors hover:bg-surface-2 sm:px-6"
      >
        <AlertTriangle size={14} className="shrink-0 text-warn-fg" aria-hidden="true" />
        <span className="font-bold text-text-2">확인할 점 {items.length}가지</span>
        {days.length > 0 && (
          <span className="truncate">
            Day {days.join(' · ')}
          </span>
        )}
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`ml-auto shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul className="space-y-1 px-4 pb-2.5 pl-[34px] text-xs text-muted sm:px-6 sm:pl-[44px]">
          {sorted.map((item, i) => (
            <li key={`${item.day}-${item.text}-${i}`} className="flex items-baseline gap-2">
              {item.day != null && (
                <span className="w-[42px] shrink-0 font-bold tabular-nums text-text-2">Day {item.day}</span>
              )}
              <span className="min-w-0">{item.text}</span>
            </li>
          ))}
          {causes.map((cause) => (
            // 항목마다 반복되던 원인 문장. 한 번만 각주로 모은다.
            <li key={cause} className="pt-0.5 text-muted-2">
              {cause}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
