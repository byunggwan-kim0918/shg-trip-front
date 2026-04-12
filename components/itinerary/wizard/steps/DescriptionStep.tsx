'use client';

import { useWizardStore } from '@/lib/stores/useWizardStore';

export default function DescriptionStep() {
  const { data, updateData } = useWizardStore();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">부가 설명</h2>
      <p className="text-sm text-muted">AI에게 전달할 상세 요청사항을 적어주세요 (선택)</p>
      <textarea
        value={data.description}
        onChange={(e) => updateData({ description: e.target.value })}
        placeholder="예: 시부야 중심으로 돌고 싶어요, 현지인 맛집 위주로, 오전에는 여유롭게 등"
        rows={5}
        className="w-full px-4 py-3 rounded-lg border border-card-border bg-card-bg text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
      />
      <p className="text-xs text-muted text-right">{data.description.length}자</p>
    </div>
  );
}
