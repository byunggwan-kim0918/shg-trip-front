'use client';

import { useSearchParams } from 'next/navigation';
import TripChat from '@/components/trip-chat/TripChat';
import type { TripChatSlot } from '@/lib/types/tripChat';

const SLOTS: ReadonlySet<string> = new Set(['CITY', 'DATES', 'COMPANY', 'MOOD', 'TRANSPORT', 'ANCHORS', 'EXTRAS']);

/** 생성 화면의 "조건 수정"은 ?focus=<항목>으로 돌아와 확인 화면에서 그 항목을 강조한다. */
export default function PlanNewPage() {
  const focus = useSearchParams().get('focus');
  return <TripChat focusSlot={focus && SLOTS.has(focus) ? (focus as TripChatSlot) : null} />;
}
