import Link from 'next/link';
import { LinkIcon } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';

export default function SharedNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <EmptyState
          icon={LinkIcon}
          title="링크가 만료됐거나 잘못됐어요"
          description="공유 링크가 유효하지 않거나 만료되었습니다."
        />
        <div className="mt-4 text-center">
          <Link href="/" className="text-[13px] font-semibold text-accent-weak-fg hover:underline">
            SHG trip 홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}
