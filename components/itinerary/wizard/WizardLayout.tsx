'use client';

import { type ReactNode, useRef, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useWizardStore } from '@/lib/stores/useWizardStore';
import ProgressBar from '@/components/common/ProgressBar';

interface WizardLayoutProps {
  children: ReactNode[];
  /** 선택(건너뛰기 가능) 단계 인덱스. "선택" 배지 + "건너뛰기" 노출. */
  optionalSteps?: number[];
}

export default function WizardLayout({ children, optionalSteps = [] }: WizardLayoutProps) {
  const { currentStep, isStepValid, nextStep, prevStep, getTotalSteps } = useWizardStore();
  const totalSteps = getTotalSteps();
  const containerRef = useRef<HTMLDivElement>(null);
  const isOptional = optionalSteps.includes(currentStep);
  const isLast = currentStep === totalSteps - 1;

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0 });
  }, [currentStep]);

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col">
      {/* 헤더: 뒤로 + 진행바 + N/5 */}
      <div className="flex items-center gap-3 px-4 py-4">
        <button
          type="button"
          onClick={prevStep}
          disabled={currentStep === 0}
          className="shrink-0 rounded-lg p-1 text-foreground transition-colors hover:bg-surface-hover disabled:opacity-30"
          aria-label="이전 단계"
        >
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <ProgressBar value={((currentStep + 1) / totalSteps) * 100} height={6} className="flex-1" />
        <span
          className={`shrink-0 text-xs font-bold ${isLast ? 'text-success' : 'text-muted-2'}`}
        >
          {currentStep + 1}/{totalSteps}
          {isOptional && <span className="ml-1 font-semibold text-muted-2">· 선택</span>}
        </span>
      </div>

      {/* 슬라이드 컨테이너 */}
      <div ref={containerRef} className="relative flex-1 overflow-hidden">
        <div
          className="flex h-full transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentStep * 100}%)` }}
        >
          {children.map((child, i) => (
            <div key={i} className="w-full flex-shrink-0 overflow-y-auto px-4 py-4">
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* 하단 nav (마지막 단계는 자체 생성 CTA가 있으므로 다음 버튼 숨김) */}
      {!isLast && (
        <div className="flex items-center justify-between gap-3 border-t border-divider px-4 py-4">
          {isOptional ? (
            <button
              type="button"
              onClick={nextStep}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-surface-hover"
            >
              건너뛰기
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={nextStep}
            disabled={!isStepValid}
            className={`min-h-[44px] rounded-xl px-7 py-2.5 text-sm font-bold transition-colors ${
              isStepValid
                ? 'bg-accent text-white shadow-[0_8px_18px_-8px_var(--accent)] hover:bg-accent-hover'
                : 'cursor-not-allowed bg-surface-3 text-muted-2'
            }`}
          >
            다음 →
          </button>
        </div>
      )}
    </div>
  );
}
