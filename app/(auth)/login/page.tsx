import { Suspense } from 'react';
import SocialLoginGroup from '@/components/auth/SocialLoginGroup';
import LoginErrorToast from '@/components/auth/LoginErrorToast';
import DestinationCover from '@/components/common/DestinationCover';
import Logo from '@/components/common/Logo';

/**
 * 로그인 좌측 콜라주. 랜딩 히어로와 같은 4개 목적지를 써서 화면 간 연속성을 유지한다.
 * imageUrl 미지정 → DestinationCover가 목적지별 hue 그라데이션으로 폴백한다.
 * picsum 시드는 목적지와 무관한 사진을 주어(제주에 아이슬란드) 신뢰를 깨므로 쓰지 않는다.
 * 실장소 사진 파이프라인이 이 화면에 열리면 places.image_url을 주입
 * (DestinationCover가 사진 우선 → 그라데이션 폴백을 처리한다).
 *
 * 구성: 2×2 그리드로 짜면 한 행의 높이가 큰 타일에 맞춰져 작은 타일 아래에 빈 칸이 생기고,
 * 거기에 translate-y까지 얹혀 우측 열이 좌측보다 220px 아래로 삐져나왔다. "비대칭"이 아니라
 * 그냥 어긋난 것이다. 대신 **두 개의 세로 열**로 짜고 각 열에 [높은 것 + 낮은 것]을 교차 배치한다.
 * 4/5 + 5/4 = 두 열의 합이 정확히 같아져 위아래가 맞으면서, 열마다 형태 순서가 반대라 리듬은 남는다.
 */
const COLUMN_A = [
  { destination: '제주', shape: 'md:aspect-[4/5]' },
  { destination: '경주', shape: 'md:aspect-[5/4]' },
];
const COLUMN_B = [
  { destination: '부산', shape: 'md:aspect-[5/4]' },
  { destination: '도쿄', shape: 'md:aspect-[4/5]' },
];


/** 진입 모션(design-dna.md §7). 대상에 따라 메커니즘을 나눈다.
 *  텍스트=아래서 위로 "도착" / 이미지=거의 제자리에서 "안착"(4px). 같은 효과를 전부에 복사하지 않는다. */
const ENTER_TEXT =
  'motion-safe:opacity-0 motion-safe:[animation:fade-in-up_400ms_cubic-bezier(0.23,1,0.32,1)_forwards]';
const ENTER_MEDIA =
  'motion-safe:opacity-0 motion-safe:[animation:shg-fade-in_500ms_cubic-bezier(0.23,1,0.32,1)_forwards]';

export default function LoginPage() {
  return (
    <div className="w-full max-w-5xl">
      <Suspense fallback={null}>
        <LoginErrorToast />
      </Suspense>

      {/* 분할 인증: 좌 콜라주 / 우 카드. 모바일은 세로 스택(콜라주 위, 카드 아래). */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.15fr_1fr] md:items-center md:gap-14">
        {/* 좌: 목적지 콜라주 */}
        <div className={`${ENTER_MEDIA} md:max-w-[480px]`}>
          <p className="mb-4 text-[15px] font-semibold text-text-2">다음 여행은 어디로?</p>
          {/* 모바일은 4열 한 줄 스트립(contents로 열 래퍼를 무력화), 데스크톱은 2열 세로 스택 */}
          <div className="grid grid-cols-4 gap-2 md:grid-cols-2 md:items-start md:gap-4">
            <div className="contents md:flex md:flex-col md:gap-4">
              {COLUMN_A.map((t, i) => (
                <DestinationCover
                  key={t.destination}
                  destination={t.destination}
                  seedOffset={i * 7}
                  rich
                  labelSize={22}
                  className={`h-[112px] rounded-2xl md:h-auto ${t.shape}`}
                />
              ))}
            </div>
            {/* 우측 열만 살짝 내려 리듬을 준다. 열 높이가 같으므로 이 값만큼만 어긋난다 */}
            <div className="contents md:mt-7 md:flex md:flex-col md:gap-4">
              {COLUMN_B.map((t, i) => (
                <DestinationCover
                  key={t.destination}
                  destination={t.destination}
                  seedOffset={(i + 2) * 7}
                  rich
                  labelSize={22}
                  className={`h-[112px] rounded-2xl md:h-auto ${t.shape}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 우: 로그인 카드. 좌측 정렬. */}
        <div className={`${ENTER_TEXT} motion-safe:[animation-delay:80ms] flex w-full max-w-[380px] flex-col items-start text-left`}>
          <Logo size={62} className="mb-5" />
          <h1 className="text-[23px] font-extrabold tracking-[-0.02em] text-foreground">SHG trip</h1>
          <p className="mt-1.5 text-sm text-text-2">한 문장으로 시작하세요</p>

          <div className="mt-8 w-full">
            <SocialLoginGroup />
          </div>

          <p className="mt-6 text-[11px] leading-relaxed text-text-2">
            시작하면{' '}
            <a href="/terms" className="underline transition-colors hover:text-foreground">이용약관</a>
            {' '}및{' '}
            <a href="/privacy" className="underline transition-colors hover:text-foreground">개인정보처리방침</a>
            에 동의하게 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
