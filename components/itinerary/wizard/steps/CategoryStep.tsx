'use client';

import { useWizardStore } from '@/lib/stores/useWizardStore';
import ChipSelect from '@/components/itinerary/wizard/ChipSelect';
import type { Category } from '@/lib/types/itinerary';

const CATEGORY_OPTIONS: { id: Category; label: string }[] = [
  { id: 'attraction', label: '관광지' },
  { id: 'restaurant', label: '맛집' },
  { id: 'cafe', label: '카페' },
  { id: 'accommodation', label: '숙박' },
  { id: 'experience', label: '체험/액티비티' },
  { id: 'shopping', label: '쇼핑' },
  { id: 'nightlife', label: '나이트라이프' },
  { id: 'nature', label: '자연/공원' },
  { id: 'museum', label: '박물관/미술관' },
  { id: 'theme_park', label: '테마파크' },
  { id: 'spa', label: '스파/웰니스' },
  { id: 'market', label: '시장/로컬푸드' },
  { id: 'beach', label: '해변/바다' },
  { id: 'temple', label: '사찰/성당' },
  { id: 'street_food', label: '길거리 음식' },
  { id: 'viewpoint', label: '전망대/뷰포인트' },
  { id: 'trail', label: '산책로/둘레길' },
];

export default function CategoryStep() {
  const { data, updateData } = useWizardStore();

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-foreground">카테고리</h2>
      <p className="text-sm text-muted">관심 있는 카테고리를 선택하세요 (1개 이상)</p>
      <ChipSelect
        options={CATEGORY_OPTIONS}
        selected={data.categories}
        onChange={(categories) => updateData({ categories: categories as Category[] })}
        minSelect={0}
      />
    </div>
  );
}
