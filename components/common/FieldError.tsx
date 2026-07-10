import { X } from 'lucide-react';

interface Props {
  message: string;
  className?: string;
}

/** 인라인 입력 오류 메시지 (4e). danger 색 + ✕ 아이콘. */
export default function FieldError({ message, className = '' }: Props) {
  return (
    <div className={`mt-1.5 flex items-center gap-1 text-xs font-semibold text-danger ${className}`}>
      <X size={12} strokeWidth={2.5} aria-hidden="true" />
      {message}
    </div>
  );
}
