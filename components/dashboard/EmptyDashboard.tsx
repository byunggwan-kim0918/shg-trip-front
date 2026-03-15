'use client';

import { useRouter } from 'next/navigation';
import { EmptyTripIcon, AutoModeIcon, ManualModeIcon } from '@/components/icons/TripIcons';
import CreateTripCard from './CreateTripCard';

export default function EmptyDashboard() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-4">
      {/* 메인 아이콘 */}
      <div className="animate-fade-in-up mb-8">
        <EmptyTripIcon />
      </div>

      {/* 텍스트 */}
      <h2 className="animate-fade-in-up animation-delay-100 text-2xl sm:text-3xl font-bold text-foreground mb-3 text-center">
        아직 계획된 여행이 없어요
      </h2>
      <p className="animate-fade-in-up animation-delay-200 text-muted text-center mb-12 max-w-md leading-relaxed">
        AI가 최적의 여행 일정을 만들어 드립니다.
        <br />
        목적지와 날짜만 알려주세요!
      </p>

      {/* CTA 카드 */}
      <div className="animate-fade-in-up animation-delay-300 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl">
        <CreateTripCard
          icon={<AutoModeIcon />}
          title="AI 추천"
          description="목적지와 날짜만 입력하면 장소 선택부터 동선까지 AI가 전부 완성합니다"
          onClick={() => router.push('/main/plan/new?mode=auto')}
          gradient="from-teal-400 to-blue-500"
          recommended
        />
        <CreateTripCard
          icon={<ManualModeIcon />}
          title="AI 맞춤 설계"
          description="가고 싶은 장소를 고르면 AI가 최적의 동선과 일정을 짜드립니다"
          onClick={() => router.push('/main/plan/new?mode=manual')}
          gradient="from-purple-400 to-pink-500"
        />
      </div>
    </div>
  );
}
