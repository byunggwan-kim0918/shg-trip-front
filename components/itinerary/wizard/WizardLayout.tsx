'use client';

import { type ReactNode, useRef, useEffect } from 'react';
import { useWizardStore } from '@/lib/stores/useWizardStore';

interface WizardLayoutProps {
  children: ReactNode[];
}

export default function WizardLayout({ children }: WizardLayoutProps) {
  const { currentStep, isStepValid, nextStep, prevStep, getTotalSteps } = useWizardStore();
  const totalSteps = getTotalSteps();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0 });
  }, [currentStep]);

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      {/* 단계 표시기 */}
      <div className="text-center py-4">
        <span className="text-sm font-medium text-muted">
          {currentStep + 1} / {totalSteps}
        </span>
        <div className="mt-2 h-1 bg-surface rounded-full overflow-hidden max-w-xs mx-auto">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* 슬라이드 컨테이너 */}
      <div ref={containerRef} className="flex-1 overflow-hidden relative">
        <div
          className="flex transition-transform duration-300 ease-in-out h-full"
          style={{ transform: `translateX(-${currentStep * 100}%)` }}
        >
          {children.map((child, i) => (
            <div key={i} className="w-full flex-shrink-0 px-4 py-6 overflow-y-auto">
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* 네비게이션 버튼 */}
      <div className="flex justify-between items-center px-4 py-4 border-t border-card-border">
        <button
          type="button"
          onClick={prevStep}
          disabled={currentStep === 0}
          className={`
            px-6 py-2.5 rounded-lg text-sm font-medium min-h-[44px] transition-colors
            ${currentStep === 0
              ? 'text-muted/40 cursor-not-allowed'
              : 'text-foreground hover:bg-surface-hover'
            }
          `}
        >
          이전
        </button>
        {currentStep < totalSteps - 1 && (
          <button
            type="button"
            onClick={nextStep}
            disabled={!isStepValid}
            className={`
              px-6 py-2.5 rounded-lg text-sm font-medium min-h-[44px] transition-colors
              ${isStepValid
                ? 'bg-accent text-white hover:bg-accent-hover'
                : 'bg-surface text-muted/40 cursor-not-allowed'
              }
            `}
          >
            다음
          </button>
        )}
      </div>
    </div>
  );
}
