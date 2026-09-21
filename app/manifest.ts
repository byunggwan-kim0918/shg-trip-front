import type { MetadataRoute } from 'next';

/**
 * 웹 매니페스트. 없으면 안드로이드 "홈 화면에 추가" 시 이름이 <title> 전체로 잘려 나오고
 * 아이콘도 브라우저 기본 스크린샷이 된다 — 아이콘을 정리한 김에 마지막 표면까지 맞춘다.
 *
 * `display: 'browser'`로 둔다. 서비스 워커가 없어 오프라인이 안 되는데 standalone으로 띄우면
 * 주소창 없이 열려 네트워크가 끊겼을 때 빠져나갈 방법이 없다.
 *
 * 색은 globals.css 토큰과 같은 값(라이트 --background / --accent). 매니페스트는 CSS 변수를
 * 읽을 수 없어 리터럴이 불가피하므로, 토큰이 바뀌면 여기도 같이 고쳐야 한다.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SHG trip · AI 여행 플래너',
    short_name: 'SHG trip',
    description: '말 한마디면, 여행이 완성됩니다. AI가 동선·시간·예산까지 한 번에.',
    lang: 'ko',
    start_url: '/main',
    display: 'browser',
    background_color: '#eef0f4',
    theme_color: '#eef0f4',
    icons: [
      { src: '/icon.svg', type: 'image/svg+xml', sizes: 'any' },
      { src: '/apple-icon', type: 'image/png', sizes: '180x180' },
    ],
  };
}
