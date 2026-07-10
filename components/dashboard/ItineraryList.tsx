'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, MoreHorizontal, MapPinned } from 'lucide-react';
import type { ItinerarySummary } from '@/lib/types/itinerary';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import ConfirmModal from '@/components/common/ConfirmModal';
import StatusDot from '@/components/common/StatusDot';
import TagChip from '@/components/common/TagChip';
import DestinationCover from '@/components/common/DestinationCover';
import EmptyState from '@/components/common/EmptyState';
import {
  FILTER_TABS,
  type TripFilter,
  matchesFilter,
  displayStatus,
  daysUntil,
  ddayLabel,
  dateRange,
  nightsLabel,
} from '@/lib/utils/tripStatus';

interface Props {
  /** 미지정 시 스토어에서 직접 로드(내 여행 페이지 겸용). */
  itineraries?: ItinerarySummary[];
}

export default function ItineraryList({ itineraries: itinerariesProp }: Props) {
  const router = useRouter();
  const {
    itineraries: storeItineraries,
    loadItineraries,
    removeItinerary,
    isDeleting,
  } = useItineraryStore();

  const selfLoad = itinerariesProp === undefined;
  useEffect(() => {
    if (selfLoad) loadItineraries();
  }, [selfLoad, loadItineraries]);

  const itineraries = itinerariesProp ?? storeItineraries;

  const [filter, setFilter] = useState<TripFilter>('all');
  const [openCardMenuId, setOpenCardMenuId] = useState<number | null>(null);
  const cardMenuRef = useRef<HTMLDivElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<ItinerarySummary | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (cardMenuRef.current && !cardMenuRef.current.contains(e.target as Node)) setOpenCardMenuId(null);
    }
    if (openCardMenuId !== null) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openCardMenuId]);

  /** 필터 적용된 목록. */
  const filtered = useMemo(
    () => itineraries.filter((t) => matchesFilter(t, filter)),
    [itineraries, filter],
  );

  /** 히어로 = 예정/여행중 중 startDate가 가장 가까운 것(D-day 최소, 음수 제외 우선). */
  const hero = useMemo(() => {
    const candidates = itineraries
      .filter((t) => {
        const s = displayStatus(t);
        return s === 'upcoming' || s === 'ongoing';
      })
      .sort((a, b) => {
        const da = daysUntil(a.startDate);
        const db = daysUntil(b.startDate);
        // 여행중(음수~0)·임박 순: 절대 임박도 기준
        return Math.abs(da) - Math.abs(db);
      });
    return candidates[0] ?? null;
  }, [itineraries]);

  /** 그리드 = 히어로 제외 나머지. */
  const gridItems = useMemo(
    () => filtered.filter((t) => t.id !== hero?.id),
    [filtered, hero],
  );

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeItinerary(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      alert('일정 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const goToStep = (item: ItinerarySummary) => router.push(`/main/itinerary/${item.id}`);

  return (
    <div className="mx-auto max-w-6xl px-1 py-2">
      {/* 헤더 */}
      <div className="mb-[18px] flex items-end justify-between">
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-foreground">내 여행</h1>
          <span className="text-sm font-semibold text-muted">{itineraries.length}개</span>
        </div>
        <button
          type="button"
          onClick={() => router.push('/main/plan/new')}
          className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-[13.5px] font-bold text-white shadow-[0_8px_20px_-8px_var(--accent)] transition-[filter] hover:brightness-105"
        >
          <Plus size={15} strokeWidth={2.5} /> 새 여행
        </button>
      </div>

      {/* 필터 탭 */}
      <div className="mb-5 flex gap-1.5">
        {FILTER_TABS.map((tab) => {
          const active = filter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`rounded-full px-3.5 py-[7px] text-[13px] font-semibold transition-colors ${
                active ? 'bg-accent text-white' : 'bg-surface-3 text-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 히어로 카드 — 필터 'all'일 때만 노출 */}
      {hero && filter === 'all' && (
        <button
          type="button"
          onClick={() => goToStep(hero)}
          className="group relative mb-[18px] block h-[200px] w-full overflow-hidden rounded-[18px] border border-card-border text-left"
        >
          <DestinationCover
            destination={hero.destination}
            imageUrl={hero.coverImage}
            scrim
            labelSize={84}
            className="absolute inset-0 h-full w-full"
          />
          <div className="absolute inset-0 flex flex-col justify-between p-6">
            <div className="flex gap-2">
              <span className="rounded-full bg-white/92 px-2.5 py-1 text-xs font-bold text-[#14161c]">
                {ddayLabel(hero.startDate)}
              </span>
              <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-[4px]">
                가장 가까운 여행
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="text-2xl font-extrabold tracking-[-0.02em] text-white">
                {hero.title ?? hero.destination}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {hero.tags.slice(0, 3).map((t) => (
                  <span key={t} className="rounded-full bg-white/18 px-2.5 py-1 text-xs font-semibold text-white">
                    {t}
                  </span>
                ))}
                <span className="ml-1 text-[13px] font-medium text-white/85">
                  {dateRange(hero.startDate, hero.endDate)} · {nightsLabel(hero.startDate, hero.endDate)}
                </span>
              </div>
            </div>
          </div>
        </button>
      )}

      {/* 그리드 */}
      {gridItems.length === 0 ? (
        <div className="py-10">
          <EmptyState
            icon={MapPinned}
            title="해당하는 여행이 없어요"
            description={filter === 'all' ? '새 여행을 만들어보세요.' : '다른 필터를 선택해보세요.'}
            className="mx-auto max-w-sm"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gridItems.map((item, idx) => {
            const st = displayStatus(item);
            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => goToStep(item)}
                onKeyDown={(e) => e.key === 'Enter' && goToStep(item)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-card-border bg-card-bg transition-[transform,box-shadow] duration-150 hover:-translate-y-[3px] hover:shadow-[0_14px_30px_-18px_rgba(20,22,28,0.4)]"
              >
                {/* 커버 */}
                <DestinationCover
                  destination={item.destination}
                  imageUrl={item.coverImage}
                  seedOffset={idx * 7}
                  labelSize={40}
                  className="h-[122px] w-full"
                >
                  <span className="absolute right-3 top-3 rounded-full bg-white/92 px-2.5 py-1 text-[11.5px] font-bold text-[#14161c]">
                    {ddayLabel(item.startDate)}
                  </span>
                  {/* ··· 삭제 메뉴 */}
                  <div
                    className="absolute left-2 top-2"
                    ref={openCardMenuId === item.id ? cardMenuRef : undefined}
                  >
                    <button
                      type="button"
                      aria-label="일정 메뉴"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenCardMenuId((prev) => (prev === item.id ? null : item.id));
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50"
                    >
                      <MoreHorizontal size={15} />
                    </button>
                    {openCardMenuId === item.id && (
                      <div
                        className="absolute left-0 top-full mt-1 w-28 overflow-hidden rounded-lg border border-card-border bg-card-bg shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenCardMenuId(null);
                            setDeleteTarget(item);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-danger transition-colors hover:bg-surface-hover"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                </DestinationCover>

                {/* 본문 */}
                <div className="p-[15px]">
                  <div className="mb-2.5 truncate text-[15px] font-bold text-foreground">
                    {item.title ?? item.destination}
                  </div>
                  <div className="mb-3.5 flex flex-wrap gap-1.5">
                    {item.tags.slice(0, 2).map((t) => (
                      <TagChip key={t}>{t}</TagChip>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-divider pt-3">
                    <span className="text-[12.5px] font-medium text-muted-2">
                      {dateRange(item.startDate, item.endDate)} · {nightsLabel(item.startDate, item.endDate)}
                    </span>
                    <StatusDot status={st} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
