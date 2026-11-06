/** PlaceResponse가 이미 S3 URL 또는 null을 주므로 그대로 돌려준다. */
export function proxyImageUrl(url: string | null | undefined): string | null {
  return url || null;
}
