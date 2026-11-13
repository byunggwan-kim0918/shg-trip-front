import { resolvePlaceArt, type PlaceArtGroup } from '@/lib/constants/placeIcons';

/** 사진 카드와 나란히 놓이므로 색면이 사진과 경쟁하지 않게 무채 토큰의 명도로만 묶음을 나눈다. */
const GROUP_TONE: Record<PlaceArtGroup, string> = {
  nature: 'bg-foreground/[0.035]',
  stay: 'bg-foreground/[0.035]',
  food: 'bg-foreground/[0.055]',
  shopping: 'bg-foreground/[0.055]',
  leisure: 'bg-foreground/[0.055]',
  default: 'bg-foreground/[0.055]',
  culture: 'bg-foreground/[0.075]',
  transport: 'bg-foreground/[0.075]',
};

const ECHO_CLASS = {
  md: 'absolute -bottom-4 -right-4 h-16 w-16',
  banner: 'absolute -bottom-7 left-6 h-28 w-28',
} as const;

interface Props {
  /** 장소 분류 경로. 없으면 핀으로 그린다. */
  category?: string | null;
  /** sm: 44px 썸네일 · md: 72~74px 정사각형 · banner: 가로로 긴 카드 커버 */
  size?: 'sm' | 'md' | 'banner';
  /** 크기·위치. 배경 톤은 분류가 정한다. */
  className?: string;
}

export default function PlaceFallbackArt({ category, size = 'md', className = '' }: Props) {
  const { icon: Icon, group } = resolvePlaceArt(category);
  return (
    <div aria-hidden="true" className={`overflow-hidden ${GROUP_TONE[group]} ${className}`}>
      <div className="relative flex h-full w-full items-center justify-center">
        {size !== 'sm' && (
          <Icon strokeWidth={1.25} className={`${ECHO_CLASS[size]} -rotate-12 text-foreground/[0.07]`} />
        )}
        {/* 배너는 목적지 이름이 주역이라 큰 그림만 깔고 아이콘을 따로 세우지 않는다. */}
        {size !== 'banner' && (
          <Icon size={size === 'sm' ? 18 : 24} strokeWidth={1.75} className="relative text-muted-2" />
        )}
      </div>
    </div>
  );
}
