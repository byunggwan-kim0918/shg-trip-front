import type { MetadataRoute } from 'next';
import { ROUTES } from '@/lib/routes';

/**
 * 서비스 워커가 없어 standalone이면 네트워크가 끊겼을 때 빠져나갈 주소창이 없으므로 `display: 'browser'`로 둔다.
 * 매니페스트는 CSS 변수를 못 읽으므로 색은 globals.css 토큰(--background / --accent)과 같이 고쳐야 한다.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SHG trip · 여행 플래너',
    short_name: 'SHG trip',
    description: '말 한마디면, 여행이 완성됩니다. 동선·시간·예산까지 한 번에.',
    lang: 'ko',
    start_url: ROUTES.trips,
    display: 'browser',
    background_color: '#eef0f4',
    theme_color: '#eef0f4',
    icons: [
      { src: '/icon.svg', type: 'image/svg+xml', sizes: 'any' },
      { src: '/apple-icon', type: 'image/png', sizes: '180x180' },
    ],
  };
}
