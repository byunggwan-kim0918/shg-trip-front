'use client';

import type { Provider } from '@/lib/auth/oauthConfig';
import KakaoIcon from '@/components/icons/KakaoIcon';
import GoogleIcon from '@/components/icons/GoogleIcon';
import NaverIcon from '@/components/icons/NaverIcon';

/**
 * 버튼 위계 (리디자인 스펙):
 * 카카오만 브랜드 채움(#FEE500). 구글·네이버는 아웃라인(surface+border)이고
 * 브랜드 색은 좌측 아이콘에만 적용 → 네이버 초록 버튼이 CTA처럼 튀는 문제 해결.
 */
const PROVIDER_STYLES: Record<Provider, {
  container: string;
  iconClass?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  KAKAO: {
    container: 'bg-[#FEE500] hover:bg-[#F5DC00] text-[#191600] font-bold',
    label: '카카오로 3초 만에 시작',
    icon: KakaoIcon,
  },
  GOOGLE: {
    container: 'bg-surface border border-card-border hover:bg-surface-hover text-foreground font-semibold',
    label: 'Google로 계속하기',
    icon: GoogleIcon,
  },
  NAVER: {
    container: 'bg-surface border border-card-border hover:bg-surface-hover text-foreground font-semibold',
    iconClass: 'text-[#03C75A]',
    label: '네이버로 계속하기',
    icon: NaverIcon,
  },
};

interface SocialLoginButtonProps {
  provider: Provider;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function SocialLoginButton({ provider, onClick, disabled = false, loading = false }: SocialLoginButtonProps) {
  const style = PROVIDER_STYLES[provider];
  const Icon = style.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={loading}
      className={`
        flex w-full cursor-pointer items-center justify-center gap-2
        rounded-[10px] px-6 py-3.5
        text-[15px]
        transition-[background-color,transform,opacity] duration-200
        hover:scale-[1.01] active:scale-[0.99]
        disabled:cursor-default disabled:hover:scale-100 disabled:active:scale-100
        ${disabled && !loading ? 'opacity-50' : ''}
        ${style.container}
      `}
    >
      <Icon className={`h-[18px] w-[18px] shrink-0 ${style.iconClass ?? ''}`} />
      <span>{loading ? '로그인 화면으로 이동 중…' : style.label}</span>
    </button>
  );
}
