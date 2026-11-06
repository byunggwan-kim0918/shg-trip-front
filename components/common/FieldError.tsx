import { X } from 'lucide-react';

interface Props {
  message: string;
  className?: string;
}

export default function FieldError({ message, className = '' }: Props) {
  return (
    <div className={`mt-1.5 flex items-center gap-1 text-xs font-semibold text-danger ${className}`}>
      <X size={12} strokeWidth={2.5} aria-hidden="true" />
      {message}
    </div>
  );
}
