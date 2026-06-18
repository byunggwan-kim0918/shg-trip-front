/**
 * S3 이미지 URL을 반환 (imageUrl이 없으면 null).
 * PlaceResponse에서 이미 S3 URL 또는 null로 제공됨.
 */
export function proxyImageUrl(url: string | null | undefined): string | null {
  return url || null;
}
