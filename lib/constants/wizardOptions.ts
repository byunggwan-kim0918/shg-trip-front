import {
  Leaf, Zap, Utensils, Landmark, ShoppingBag, TreePine, Compass, Heart, Users,
  Wallet, Crown, Camera, Footprints, Waves, Mountain, Moon, Home, Palette,
  PartyPopper, PawPrint, Car, Shuffle, Coffee, type LucideIcon,
} from 'lucide-react';
import type { Theme, Category, TripPace, TransportPref } from '@/lib/types/itinerary';

/** 테마 (2단계 취향 카드). 디자인 6a 기준 대표 테마를 앞에 배치. */
export const THEME_OPTIONS: { id: Theme; label: string; icon: LucideIcon }[] = [
  { id: 'healing', label: '힐링', icon: Leaf },
  { id: 'activity', label: '액티비티', icon: Zap },
  { id: 'food', label: '맛집', icon: Utensils },
  { id: 'culture', label: '문화/역사', icon: Landmark },
  { id: 'nature', label: '자연/풍경', icon: TreePine },
  { id: 'family', label: '가족여행', icon: Users },
  { id: 'shopping', label: '쇼핑', icon: ShoppingBag },
  { id: 'adventure', label: '모험/탐험', icon: Compass },
  { id: 'romance', label: '로맨틱', icon: Heart },
  { id: 'budget', label: '알뜰여행', icon: Wallet },
  { id: 'luxury', label: '럭셔리', icon: Crown },
  { id: 'photo', label: '사진/인스타', icon: Camera },
  { id: 'walking', label: '도보/산책', icon: Footprints },
  { id: 'ocean', label: '바다/해변', icon: Waves },
  { id: 'mountain', label: '산/트레킹', icon: Mountain },
  { id: 'nightview', label: '야경/야간', icon: Moon },
  { id: 'local', label: '로컬 체험', icon: Home },
  { id: 'art', label: '예술/전시', icon: Palette },
  { id: 'festival', label: '축제/이벤트', icon: PartyPopper },
  { id: 'pet', label: '반려동물', icon: PawPrint },
];

export const CATEGORY_OPTIONS: { id: Category; label: string }[] = [
  { id: 'attraction', label: '관광지' },
  { id: 'restaurant', label: '맛집' },
  { id: 'cafe', label: '카페' },
  { id: 'viewpoint', label: '전망대/뷰포인트' },
  { id: 'beach', label: '해변/바다' },
  { id: 'market', label: '시장/로컬푸드' },
  { id: 'trail', label: '산책로/둘레길' },
  { id: 'accommodation', label: '숙박' },
  { id: 'experience', label: '체험/액티비티' },
  { id: 'shopping', label: '쇼핑' },
  { id: 'nightlife', label: '나이트라이프' },
  { id: 'nature', label: '자연/공원' },
  { id: 'museum', label: '박물관/미술관' },
  { id: 'theme_park', label: '테마파크' },
  { id: 'spa', label: '스파/웰니스' },
  { id: 'temple', label: '사찰/성당' },
  { id: 'street_food', label: '길거리 음식' },
];

export const PACE_OPTIONS: { id: TripPace; label: string; icon: LucideIcon; desc: string }[] = [
  { id: 'tight', label: '알차게', icon: Zap, desc: '하루 5~7곳' },
  { id: 'normal', label: '보통', icon: Footprints, desc: '하루 4~5곳' },
  { id: 'relaxed', label: '여유롭게', icon: Coffee, desc: '하루 2~3곳' },
];

export const TRANSPORT_OPTIONS: { id: TransportPref; label: string; icon: LucideIcon; desc: string }[] = [
  { id: 'walk', label: '도보 우선', icon: Footprints, desc: '가까운 동선' },
  { id: 'car', label: '자동차 우선', icon: Car, desc: '멀어도 OK' },
  { id: 'any', label: '상관없음', icon: Shuffle, desc: '자유롭게' },
];

/** 인기 목적지 (1단계 칩). */
export const POPULAR_DESTINATIONS = ['제주도', '부산', '강릉', '경주', '여수'];

/** 예산 퀵칩 (4단계). null=상관없음. */
export const BUDGET_QUICK_CHIPS: { label: string; value: number | null }[] = [
  { label: '50만', value: 500_000 },
  { label: '100만', value: 1_000_000 },
  { label: '200만', value: 2_000_000 },
  { label: '상관없음', value: null },
];

// 요약/라벨 조회용 맵
export const THEME_LABEL = Object.fromEntries(THEME_OPTIONS.map((t) => [t.id, t.label])) as Record<string, string>;
export const CATEGORY_LABEL = Object.fromEntries(CATEGORY_OPTIONS.map((c) => [c.id, c.label])) as Record<string, string>;
export const PACE_LABEL = Object.fromEntries(PACE_OPTIONS.map((p) => [p.id, p.label])) as Record<string, string>;
export const TRANSPORT_LABEL = Object.fromEntries(TRANSPORT_OPTIONS.map((t) => [t.id, t.label])) as Record<string, string>;

export const MAX_BUDGET = 100_000_000; // 백엔드 @DecimalMax — 1억원
export const MAX_TRIP_DAYS = 10;       // 백엔드 @ValidDateRange(maxDays=10)
export const MAX_CUSTOM_PLACES = 5;
