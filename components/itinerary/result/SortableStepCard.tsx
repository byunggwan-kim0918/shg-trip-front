'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import type { ItineraryStep } from '@/lib/types/itinerary';
import StepCard from './StepCard';

interface Props {
  step: ItineraryStep;
  /** 확인은 상위가 ConfirmModal로 한다. */
  onRequestDelete: () => void;
  /** 재정렬/삭제 in-flight이면 핸들·삭제를 막는다. */
  disabled?: boolean;
  /** day에 스텝이 1개뿐이면 false(백엔드 규칙과 같다). */
  deletable?: boolean;
}

/** 드래그 중 시각 혼란을 줄이려고 번호노드/커넥터 없는 단순 리스트로 그린다. */
export default function SortableStepCard({ step, onRequestDelete, disabled = false, deletable = true }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id,
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-2.5 flex items-center gap-1.5">
      <button
        type="button"
        className="flex h-9 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-muted-2 transition-colors hover:bg-surface-hover hover:text-foreground active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="드래그로 순서 변경"
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} aria-hidden="true" />
      </button>

      <div className="min-w-0 flex-1">
        <StepCard
          step={step}
          isExpanded={false}
          onToggleExpand={() => {}}
          onClick={() => {}}
          editMode
        />
      </div>

      <button
        type="button"
        onClick={onRequestDelete}
        disabled={disabled || !deletable}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-2 transition-colors hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-30"
        aria-label={deletable ? '스톱 삭제' : '이 날의 마지막 스톱은 삭제할 수 없어요'}
        title={deletable ? '스톱 삭제' : '이 날의 마지막 스톱은 삭제할 수 없어요'}
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
