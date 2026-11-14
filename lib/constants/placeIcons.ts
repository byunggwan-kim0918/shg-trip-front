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
  Binoculars,
  Castle,
  Church,
  Croissant,
  FerrisWheel,
  IceCreamCone,
  Martini,
  MoonStar,
  MountainSnow,
  Store,
  Ticket,
  TrainFront,
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
  DRIVE: Car,
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

export type PlaceArtGroup = 'food' | 'culture' | 'nature' | 'leisure' | 'shopping' | 'stay' | 'transport' | 'default';

export interface PlaceArt {
  icon: LucideIcon;
  group: PlaceArtGroup;
}

/**
 * Foursquare 경로("Dining and Drinking > Bar > Sake Bar")를 위에서부터 읽어 처음 맞는 규칙을 쓴다.
 * "Landmarks and Outdoors" 같은 넓은 경로가 세부 분류를 가리지 않게 세부 규칙을 앞에 둔다.
 */
const PLACE_ART_RULES: Array<[RegExp, LucideIcon, PlaceArtGroup]> = [
  [/night market|야시장/, MoonStar, 'shopping'],
  [/lodging|accommodation|숙소/, CATEGORY_ICON_MAP.accommodation, 'stay'],
  [/airport|공항/, TRANSPORT_ICON_MAP.FLIGHT, 'transport'],
  [/\btrain\b|rail station|metro station|tram station|subway/, TrainFront, 'transport'],
  [/ferry|pier/, Ship, 'transport'],
  [/travel and transportation|transport hub/, TRANSPORT_ICON_MAP.BUS, 'transport'],
  [/bakery|donut|bagel|pastry|베이커리/, Croissant, 'food'],
  [/dessert|ice cream|디저트/, IceCreamCone, 'food'],
  [/caf[eé](?!teria)|coffee|tea room|tea house|juice bar|bubble tea|카페/, CATEGORY_ICON_MAP.cafe, 'food'],
  [/\bbar\b|\bpub\b|night ?club|lounge|izakaya|brewery/, Martini, 'food'],
  [/dining and drinking|restaurant|food court|food truck|맛집|식당/, CATEGORY_ICON_MAP.restaurant, 'food'],
  [/amusement park|theme park|water park|\bzoo\b|aquarium|arcade/, FerrisWheel, 'leisure'],
  [/church|cathedral|chapel/, Church, 'culture'],
  [/castle|palace/, Castle, 'culture'],
  [/museum|art gallery|exhibit|cultural center/, THEME_ICON_MAP.art_exhibition, 'culture'],
  [/temple|shrine|spiritual center/, CATEGORY_ICON_MAP.attraction, 'culture'],
  [/performing arts|theater|theatre|concert|music venue|movie|arts and entertainment/, Ticket, 'leisure'],
  [/scenic lookout|observation|tower|viewpoint/, Binoculars, 'nature'],
  [/beach|lake|river|waterfall|\bbay\b|harbor|marina|island|hot spring|coast/, THEME_ICON_MAP.beach_sea, 'nature'],
  [/\bski\b/, MountainSnow, 'nature'],
  [/mountain|volcano|hiking|trail/, THEME_ICON_MAP.mountain_trekking, 'nature'],
  [/park|garden|forest|great outdoors|campground|\bfarm\b/, THEME_ICON_MAP.nature_landscape, 'nature'],
  [/market/, Store, 'shopping'],
  [/retail|shopping|mall|department store|store|boutique|쇼핑/, CATEGORY_ICON_MAP.shopping, 'shopping'],
  [/historic|monument|memorial|structure|attraction|landmark|plaza|bridge|관광/, CATEGORY_ICON_MAP.attraction, 'culture'],
  [/sports and recreation|outdoor activity|golf|indoor play|experience|액티비티/, CATEGORY_ICON_MAP.experience, 'leisure'],
];

/** 사진이 없는 자리에 그릴 분류 그림. 모르는 분류는 핀으로 그린다. */
export function resolvePlaceArt(category: string | null | undefined): PlaceArt {
  const lower = category?.toLowerCase() ?? '';
  for (const [pattern, icon, group] of PLACE_ART_RULES) {
    if (pattern.test(lower)) return { icon, group };
  }
  return { icon: MapPin, group: 'default' };
}
