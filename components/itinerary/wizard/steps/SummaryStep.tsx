'use client';

import { useRouter } from 'next/navigation';
import { useWizardStore } from '@/lib/stores/useWizardStore';
import { formatBudget } from '@/lib/utils/format';

const THEME_LABELS: Record<string, string> = {
  healing: '힐링', activity: '액티비티', food: '맛집 탐방',
  culture: '문화/역사', shopping: '쇼핑', nature: '자연/풍경',
  adventure: '모험/탐험', romance: '로맨틱', family: '가족여행',
  budget: '알뜰여행', luxury: '럭셔리', photo: '사진/인스타',
};
const CATEGORY_LABELS: Record<string, string> = {
  attraction: '관광지', restaurant: '맛집', cafe: '카페',
  accommodation: '숙박', experience: '체험/액티비티', shopping: '쇼핑',
  nightlife: '나이트라이프', nature: '자연/공원', museum: '박물관/미술관',
  theme_park: '테마파크', spa: '스파/웰니스', market: '시장/로컬푸드',
};

function getDuration(start: string, end: string) {
  const n = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
  return `${n}박 ${n + 1}일`;
}

export default function SummaryStep() {
  const router = useRouter();
  const { data, setStep } = useWizardStore();

  const items: { label: string; value: string; step: number }[] = [
    { label: '여행지', value: data.destination, step: 0 },
    { label: '테마', value: data.themes.map((t) => THEME_LABELS[t] || t).join(', '), step: 1 },
    { label: '카테고리', value: data.categories.map((c) => CATEGORY_LABELS[c] || c).join(', '), step: 2 },
    { label: '예산', value: data.budget ? `${formatBudget(data.budget)}원` : '미설정', step: 4 },
    {
      label: '기간',
      value: data.startDate && data.endDate
        ? `${data.startDate} ~ ${data.endDate} (${getDuration(data.startDate, data.endDate)})`
        : '미설정',
      step: 4,
    },
  ];

  if (data.mode === 'manual') {
    if (data.selectedPlaces.length > 0) {
      items.push({
        label: '선택 장소',
        value: data.selectedPlaces.map((p) => p.name).join(', '),
        step: 5,
      });
    }
    items.push({
      label: '부가 설명',
      value: data.description || '없음',
      step: 6,
    });
  }

  const handleGenerate = () => {
    // startDate/endDate 검증 (step 4에서 이미 검증되지만 방어적으로 확인)
    if (!data.startDate || !data.endDate) {
      setStep(4);
      return;
    }
    router.push('/main/itinerary/loading');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">입력 요약</h2>
      <div className="space-y-3">
        {items.filter((i) => i.value).map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => setStep(item.step)}
            className="w-full text-left p-4 rounded-xl border border-card-border bg-card-bg hover:bg-surface-hover transition-colors"
          >
            <p className="text-xs text-muted mb-1">{item.label}</p>
            <p className="text-sm text-foreground">{item.value}</p>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={handleGenerate}
        className="w-full py-3 rounded-lg bg-accent text-white font-semibold hover:bg-accent-hover transition-colors min-h-[44px]"
      >
        일정 생성
      </button>
    </div>
  );
}
