'use client';

import { useWizardStore } from '@/lib/stores/useWizardStore';

export default function DestinationStep() {
  const { data, updateData, nextStep } = useWizardStore();
  const value = data.destination;
  const showError = value.length > 0 && value.trim() === '';

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">여행지</h2>
      <p className="text-sm text-muted">어디로 떠나시나요?</p>
      <input
        type="text"
        value={value}
        onChange={(e) => updateData({ destination: e.target.value })}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); nextStep(); } }}
        placeholder="어디로 떠나시나요?"
        className="w-full px-4 py-3 rounded-lg border border-card-border bg-card-bg text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
        autoFocus
      />
      {showError && (
        <p className="text-sm text-danger">여행지를 입력해주세요</p>
      )}
    </div>
  );
}
