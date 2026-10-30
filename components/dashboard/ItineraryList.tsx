'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, MoreHorizontal, MapPinned } from 'lucide-react';
import { normalizeText } from '@/lib/utils/text';
import type { ItinerarySummary } from '@/lib/types/itinerary';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import ConfirmModal from '@/components/common/ConfirmModal';
import Toast from '@/components/common/Toast';
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
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  /** 히어로 = 현재 필터 안의 예정/여행중 중 startDate가 가장 가까운 것(D-day 최소, 음수 제외 우선). */
  const hero = useMemo(() => {
    const candidates = filtered
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
  }, [filtered]);

  /** 그리드 = 히어로 제외 나머지. */
  const gridItems = useMemo(
    () => filtered.filter((t) => t.id !== hero?.id),
    [filtered, hero],
  );

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await removeItinerary(deleteTarget.id);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : '일정 삭제에 실패했어요. 다시 시도해주세요.');
    }
    setDeleteTarget(null);
  };

  const renderCardMenu = (item: ItinerarySummary, buttonClassName: string) => (
    <div
      className="relative shrink-0"
      ref={openCardMenuId === item.id ? cardMenuRef : undefined}
    >
      <button
        type="button"
        aria-label="일정 메뉴"
        onClick={(e) => {
          e.stopPropagation();
          setOpenCardMenuId((prev) => (prev === item.id ? null : item.id));
        }}
        className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${buttonClassName}`}
      >
        <MoreHorizontal size={15} />
      </button>
      {openCardMenuId === item.id && (
        <div
          className="absolute right-0 top-full z-10 mt-1 w-28 overflow-hidden rounded-[10px] border border-card-border bg-card-bg shadow-lg"
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
  );

  const goToStep = (item: ItinerarySummary) => router.push(`/main/itinerary/${item.id}`);

  return (
    <div className="mx-auto max-w-6xl px-1 py-2">
      {/* 헤더 */}
      <div className="mb-4 flex items-end justify-between">
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-[23px] font-extrabold tracking-[-0.02em] text-foreground">내 여행</h1>
          <span className="text-sm font-semibold text-muted">{itineraries.length}개</span>
        </div>
        <button
          type="button"
          onClick={() => router.push('/main/plan/new')}
          className="flex items-center gap-1.5 rounded-[10px] bg-accent px-4 py-2.5 text-[13px] font-bold text-accent-fg shadow-[0_8px_20px_-8px_rgba(20,22,28,0.45)] transition-[filter] hover:brightness-105"
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
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                active ? 'bg-accent-soft text-accent-weak-fg ring-1 ring-accent-weak-fg/25' : 'bg-surface-3 text-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 히어로 카드 — 메뉴 버튼을 카드 버튼 안에 중첩할 수 없어 형제로 겹친다 */}
      {hero && (
        <div className="relative mb-4">
          <button
            type="button"
            onClick={() => goToStep(hero)}
            className="group relative block w-full overflow-hidden rounded-xl border border-card-border bg-card-bg text-left transition-[box-shadow] duration-150 hover:shadow-[0_14px_30px_-20px_rgba(20,22,28,0.35)]"
          >
            {/* 사진이 있으면 사진이 주역이고, 없으면 **색면 대신 정보**가 주역이다.
                예전엔 사진이 없어도 200px 그라데이션 배너를 깔고 그 위에 흰 글자를 얹었는데,
                이 제품에는 커버 사진이 사실상 없어서 화면에서 가장 큰 요소가 늘 "정보 0인 색 띠"였다. */}
            {hero.coverImage ? (
              <div className="relative h-[200px] w-full">
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
                      <span className="tabular-nums">{ddayLabel(hero.startDate)}</span>
                    </span>
                    <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-[4px]">
                      가장 가까운 여행
                    </span>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <span className="line-clamp-2 text-[23px] font-extrabold tracking-[-0.02em] text-white">
                      {normalizeText(hero.title) || hero.destination}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {hero.tags.slice(0, 3).map((t) => (
                        <span key={t} className="rounded-full bg-white/18 px-2.5 py-1 text-xs font-semibold text-white">
                          {t}
                        </span>
                      ))}
                      <span className="ml-1 text-[13px] font-medium text-white/85">
                        <span className="tabular-nums">{dateRange(hero.startDate, hero.endDate)}</span> · <span className="tabular-nums">{nightsLabel(hero.startDate, hero.endDate)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-stretch">
                {/* D-day는 이 제품에만 있는 값이다. 다른 데서도 볼 수 있는 값보다 이게 커야 한다. */}
                <div className="flex shrink-0 flex-row items-baseline gap-3 border-card-border px-6 pt-5 sm:w-[168px] sm:flex-col sm:items-start sm:justify-center sm:gap-1.5 sm:border-r sm:px-7 sm:py-7 sm:pt-7">
                  <span className="text-[11px] font-semibold tracking-[-0.01em] text-muted">가장 가까운 여행</span>
                  <span className="font-extrabold leading-none tracking-[-0.03em] text-accent tabular-nums text-[34px]">
                    {ddayLabel(hero.startDate)}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 px-6 pb-5 pt-3 sm:px-7 sm:py-7">
                  <span className="line-clamp-2 text-[23px] font-extrabold leading-[1.3] tracking-[-0.02em] text-foreground">
                    {normalizeText(hero.title) || hero.destination}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-semibold text-text-2">{hero.destination}</span>
                    <span className="text-[13px] font-medium text-muted">
                      <span className="tabular-nums">{dateRange(hero.startDate, hero.endDate)}</span> · <span className="tabular-nums">{nightsLabel(hero.startDate, hero.endDate)}</span>
                    </span>
                    {hero.tags.slice(0, 3).map((t) => (
                      <span key={t} className="rounded-lg bg-surface-3 px-2 py-0.5 text-xs font-semibold text-text-2">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </button>
          <div className="absolute right-3 top-3">
            {renderCardMenu(
              hero,
              hero.coverImage
                ? 'bg-white/92 text-[#14161c] hover:bg-white'
                : 'text-muted-2 hover:bg-surface-hover hover:text-foreground',
            )}
          </div>
        </div>
      )}

      {/* 그리드 */}
      {gridItems.length === 0 && hero ? null : gridItems.length === 0 ? (
        <div className="py-10">
          <EmptyState
            icon={MapPinned}
            title="해당하는 여행이 없어요"
            description={filter === 'all' ? '새 여행을 만들어보세요.' : '다른 필터를 선택해보세요.'}
            className="mx-auto max-w-sm"
          />
        </div>
      ) : (
        // items-start: 사진 있는 카드와 없는 카드가 섞이면 행 높이가 가장 큰 카드에 맞춰져
        // 짧은 카드 가운데에 200px짜리 빈 구멍이 생긴다. 각 카드를 내용 높이대로 세운다.
        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gridItems.map((item, idx) => {
            const st = displayStatus(item);
            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => goToStep(item)}
                onKeyDown={(e) => e.key === 'Enter' && goToStep(item)}
                className="group relative flex h-fit cursor-pointer flex-col overflow-hidden rounded-xl border border-card-border bg-card-bg transition-[transform,box-shadow] duration-150 hover:-translate-y-[3px] hover:shadow-[0_14px_30px_-18px_rgba(20,22,28,0.4)]"
              >
                {/* 사진이 있을 때만 커버를 그린다. 사진 없이 88px 색 밴드를 깔면
                    카드를 구분하는 유일한 장치가 "정보 0인 면"이 되고, 실제로 목적지 5개가
                    같은 색으로 보였다. 사진이 없으면 그 자리를 목적지·D-day 메타 줄이 가져간다. */}
                {item.coverImage ? (
                  <DestinationCover
                    destination={item.destination}
                    imageUrl={item.coverImage}
                    seedOffset={idx * 7}
                    labelSize={30}
                    className="h-[88px] w-full"
                  >
                    <span className="absolute right-3 top-3 rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-bold text-[#14161c]">
                      <span className="tabular-nums">{ddayLabel(item.startDate)}</span>
                    </span>
                  </DestinationCover>
                ) : null}

                {/* 본문. flex-1 + 메타 mt-auto로 카드 높이를 맞춘다(제목 줄수·태그 유무와 무관). */}
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2.5 flex items-start justify-between gap-2">
                    <span className="flex min-w-0 items-baseline gap-2">
                      <span className="truncate text-[13px] font-bold text-text-2">{item.destination}</span>
                      <span className="shrink-0 text-[13px] font-bold text-accent tabular-nums">{ddayLabel(item.startDate)}</span>
                    </span>
                    <div className="-mr-1 -mt-1">
                      {renderCardMenu(item, 'text-muted-2 hover:bg-surface-hover hover:text-foreground')}
                    </div>
                  </div>
                  <div className="mb-2.5 line-clamp-2 text-[17px] font-extrabold leading-[1.35] tracking-[-0.02em] text-foreground">
                    {normalizeText(item.title) || item.destination}
                  </div>
                  {item.tags.length > 0 && (
                    <div className="mb-3.5 flex flex-wrap gap-1.5">
                      {item.tags.slice(0, 2).map((t) => (
                        <TagChip key={t}>{t}</TagChip>
                      ))}
                    </div>
                  )}
                  <div className="mt-auto flex items-center justify-between border-t border-divider pt-3">
                    <span className="text-xs font-medium text-muted-2">
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

      {deleteError && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
          <div className="w-full max-w-md">
            <Toast title="일정을 삭제하지 못했어요" description={deleteError} onClose={() => setDeleteError(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
