'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ItinerarySummary } from '@/lib/types/itinerary';
import { proxyImageUrl } from '@/lib/utils/imageUrl';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import ConfirmModal from '@/components/common/ConfirmModal';

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  DRAFT: { text: '작성 중', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  FINALIZED: { text: '확정', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  ARCHIVED: { text: '보관', className: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getDday(startDate: string) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const diff = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff > 0) return `D-${diff}`;
  if (diff === 0) return 'D-Day';
  return `D+${Math.abs(diff)}`;
}

function getTripDays(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

/** 목적지 문자열 기반 해시로 그라데이션 색상 결정 */
const GRADIENTS = [
  'from-blue-400 to-purple-500',
  'from-teal-400 to-blue-500',
  'from-rose-400 to-orange-400',
  'from-emerald-400 to-cyan-500',
  'from-violet-400 to-fuchsia-500',
  'from-amber-400 to-red-400',
  'from-sky-400 to-indigo-500',
  'from-pink-400 to-purple-500',
];

function getGradient(destination: string) {
  let hash = 0;
  for (let i = 0; i < destination.length; i++) {
    hash = destination.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

interface Props {
  itineraries: ItinerarySummary[];
}

export default function ItineraryList({ itineraries }: Props) {
  const router = useRouter();
  const { removeItinerary, isDeleting } = useItineraryStore();
  const [showModeMenu, setShowModeMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  /** 현재 ··· 메뉴가 열린 카드 id */
  const [openCardMenuId, setOpenCardMenuId] = useState<number | null>(null);
  const cardMenuRef = useRef<HTMLDivElement>(null);
  /** 삭제 확인 모달 대상 */
  const [deleteTarget, setDeleteTarget] = useState<ItinerarySummary | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowModeMenu(false);
      }
      if (cardMenuRef.current && !cardMenuRef.current.contains(e.target as Node)) {
        setOpenCardMenuId(null);
      }
    }
    if (showModeMenu || openCardMenuId !== null) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showModeMenu, openCardMenuId]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    try {
      await removeItinerary(id);
      setDeleteTarget(null);
    } catch {
      // 실패 시 모달 유지 + 알림
      alert('일정 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">내 여행</h1>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowModeMenu((v) => !v)}
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            + 새 여행
          </button>
          {showModeMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-card-bg border border-card-border rounded-lg shadow-lg z-50 overflow-hidden">
              <button
                onClick={() => { setShowModeMenu(false); router.push('/main/plan/new?mode=auto'); }}
                className="w-full px-4 py-3 text-left hover:bg-surface-hover transition-colors"
              >
                <p className="text-sm font-medium text-foreground">🤖 AI 추천</p>
                <p className="text-xs text-muted mt-0.5">AI가 장소부터 동선까지 완성</p>
              </button>
              <div className="border-t border-card-border" />
              <button
                onClick={() => { setShowModeMenu(false); router.push('/main/plan/new?mode=manual'); }}
                className="w-full px-4 py-3 text-left hover:bg-surface-hover transition-colors"
              >
                <p className="text-sm font-medium text-foreground">✋ AI 맞춤 설계</p>
                <p className="text-xs text-muted mt-0.5">장소를 고르면 AI가 동선을 짜줌</p>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {itineraries.map((item) => {
          const status = STATUS_LABEL[item.status] ?? STATUS_LABEL.DRAFT;
          const days = getTripDays(item.startDate, item.endDate);
          const dday = getDday(item.startDate);

          return (
            <div
              key={item.id}
              className="border border-card-border rounded-xl bg-card-bg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/main/itinerary/${item.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && router.push(`/main/itinerary/${item.id}`)}
            >
              {/* 커버 이미지 또는 그라데이션 */}
              <div className="h-32 relative">
                {item.coverImage ? (
                  <img
                    src={proxyImageUrl(item.coverImage)!}
                    alt={item.title ?? item.destination}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${getGradient(item.destination)}`} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-white font-semibold text-base truncate">
                    {item.title ?? item.destination}
                  </h3>
                  <p className="text-white/80 text-xs mt-0.5">
                    {item.destination}
                  </p>
                </div>
                <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                  {status.text}
                </span>

                {/* ··· 삭제 메뉴 */}
                <div
                  className="absolute top-2 left-2"
                  ref={openCardMenuId === item.id ? cardMenuRef : undefined}
                >
                  <button
                    type="button"
                    aria-label="일정 메뉴"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenCardMenuId((prev) => (prev === item.id ? null : item.id));
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
                  >
                    <span className="text-lg leading-none">⋯</span>
                  </button>
                  {openCardMenuId === item.id && (
                    <div
                      className="absolute left-0 top-full mt-1 w-32 bg-card-bg border border-card-border rounded-lg shadow-lg overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenCardMenuId(null);
                          setDeleteTarget(item);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-danger hover:bg-surface-hover transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 하단 정보 */}
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span>📅 {formatDate(item.startDate)} - {formatDate(item.endDate)}</span>
                  <span>{days}일</span>
                </div>
                <span className="text-xs font-semibold text-accent">{dday}</span>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        title="일정을 삭제할까요?"
        message={`'${deleteTarget?.title ?? deleteTarget?.destination ?? ''}' 일정을 삭제합니다. 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        danger
        busy={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
