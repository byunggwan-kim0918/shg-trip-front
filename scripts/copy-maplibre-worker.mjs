/**
 * maplibre-gl 워커를 public/으로 복사한다.
 *
 * maplibre v6은 워커 URL을 `import.meta.url` 기준 상대경로(`./maplibre-gl-worker.mjs`)로
 * 만든다. Next 번들러를 거치면 그 기준이 청크 경로가 되고 거기엔 워커 파일이 없다.
 * 결과는 조용한 실패다 — "Worker failed to load" 콘솔 에러 하나만 뜨고, 마커·경로선은
 * 정상인데 **베이스맵만 백지**로 남는다(벡터 타일 디코딩이 전부 워커에서 돈다).
 *
 * 그래서 워커를 정적 파일로 두고 `setWorkerUrl('/maplibre-gl-worker.mjs')`로 못 박는다.
 * 버전이 어긋나면 런타임에 깨지므로 빌드·개발 시작마다 다시 복사한다(predev/prebuild).
 * 산출물이라 git에는 넣지 않는다.
 */
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs');
const dest = join(root, 'public/maplibre-gl-worker.mjs');

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);

const version = JSON.parse(
  readFileSync(join(root, 'node_modules/maplibre-gl/package.json'), 'utf8'),
).version;
console.log(`maplibre-gl ${version} worker → public/maplibre-gl-worker.mjs`);
