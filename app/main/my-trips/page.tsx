'use client';

import ItineraryList from '@/components/dashboard/ItineraryList';

export default function MyTripsPage() {
  // 대시보드와 동일 컴포넌트 재사용 (self-load). 중복 목록 컴포넌트 제거.
  return <ItineraryList />;
}
