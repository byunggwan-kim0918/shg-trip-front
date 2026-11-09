/**
 * 장소 카테고리는 Foursquare 경로("Dining and Drinking > Restaurant > …")라 그대로 보여 줄 수 없어
 * 표시용 대분류로 줄인다. 일정 판정에 쓰는 백엔드 대분류와는 다르다. 모르는 경로는 null.
 */
export function placeCategoryLabel(category: string | null | undefined): string | null {
  if (!category) return null;
  const lower = category.toLowerCase();
  if (lower.includes('lodging')) return '숙소';
  if (lower.includes('dining and drinking') && !lower.includes('cafeteria')
    && (lower.includes('cafe') || lower.includes('coffee') || lower.includes('bakery') || lower.includes('dessert'))) return '카페';
  if (lower.includes('dining and drinking') || lower.includes('restaurant')) return '식당';
  if (lower.includes('landmarks') || lower.includes('arts and entertainment') || lower.includes('outdoors')
    || lower.includes('spiritual center')) return '관광';
  if (lower.includes('sports and recreation')) return '체험';
  if (lower.includes('retail') || lower.includes('market') || lower.includes('shopping')) return '쇼핑';
  if (lower.includes('travel and transportation')) return '교통';
  return null;
}
