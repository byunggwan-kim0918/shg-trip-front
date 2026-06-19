import {
  Landmark,
  Utensils,
  Coffee,
  BedDouble,
  Compass,
  ShoppingBag,
  MapPin,
  Footprints,
  Bus,
  Train,
  Car,
  Bike,
  Plane,
  Train as SubwayTrain,
  Car as TaxiCar,
  Leaf,
  Zap,
  TreePine,
  Heart,
  Users,
  Wallet,
  Crown,
  Camera,
  Waves,
  Mountain,
  Moon,
  Home,
  Palette,
  PartyPopper,
  PawPrint,
  Star,
  Ship,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  attraction: Landmark,
  관광: Landmark,
  restaurant: Utensils,
  맛집: Utensils,
  cafe: Coffee,
  카페: Coffee,
  accommodation: BedDouble,
  숙소: BedDouble,
  experience: Compass,
  액티비티: Compass,
  shopping: ShoppingBag,
  쇼핑: ShoppingBag,
};

export const TRANSPORT_ICON_MAP: Record<string, LucideIcon> = {
  WALK: Footprints,
  BUS: Bus,
  TRAIN: Train,
  SUBWAY: SubwayTrain,
  TAXI: TaxiCar,
  CAR: Car,
  BIKE: Bike,
  FLIGHT: Plane,
};

export const THEME_ICON_MAP: Record<string, LucideIcon> = {
  healing: Leaf,
  힐링: Leaf,
  activity: Zap,
  액티비티: Zap,
  restaurant_exploration: Utensils,
  맛집탐방: Utensils,
  culture_history: Landmark,
  문화역사: Landmark,
  shopping: ShoppingBag,
  쇼핑: ShoppingBag,
  nature_landscape: TreePine,
  자연풍경: TreePine,
  adventure_exploration: Compass,
  모험탐험: Compass,
  romantic: Heart,
  로맨틱: Heart,
  family: Users,
  가족여행: Users,
  budget_travel: Wallet,
  알뜰여행: Wallet,
  luxury: Crown,
  럭셔리: Crown,
  photography: Camera,
  사진인스타: Camera,
  walking: Footprints,
  도보산책: Footprints,
  beach_sea: Waves,
  바다해변: Waves,
  mountain_trekking: Mountain,
  산트레킹: Mountain,
  night_view: Moon,
  야경야간: Moon,
  local_experience: Home,
  로컬체험: Home,
  art_exhibition: Palette,
  예술전시: Palette,
  festival_event: PartyPopper,
  축제이벤트: PartyPopper,
  pet: PawPrint,
  반려동물: PawPrint,
};

export const PACE_ICON_MAP: Record<string, LucideIcon> = {
  tight: Zap,
  알차게: Zap,
  normal: Footprints,
  보통: Footprints,
  relaxed: Coffee,
  여유롭게: Coffee,
};

export const LOADING_STAGE_ICONS: LucideIcon[] = [
  Zap, // 분석 중
  TreePine, // 동선 계산
  Star, // 품질 검증
  Wallet, // 저장
];

export const LOADING_VEHICLE_ICONS: LucideIcon[] = [
  Plane,
  Car,
  Train,
  Ship,
  Bus,
  Bike,
];

export function getCategoryIcon(category: string): LucideIcon {
  return CATEGORY_ICON_MAP[category] || MapPin;
}

export function getTransportIcon(transport: string): LucideIcon {
  return TRANSPORT_ICON_MAP[transport] || Footprints;
}

export function getThemeIcon(theme: string): LucideIcon {
  return THEME_ICON_MAP[theme] || Leaf;
}

export function getPaceIcon(pace: string): LucideIcon {
  return PACE_ICON_MAP[pace] || Footprints;
}
