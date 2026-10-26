import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Playwright E2E: 러너/픽스처 규약(use 픽스처 등)이 앱 린트 규칙과 달라 제외.
    "e2e/**",
    "playwright.config.ts",
    "playwright-report/**",
    "test-results/**",
    // predev/prebuild가 node_modules에서 복사해 오는 maplibre 워커(518KB 번들).
    // 우리 코드가 아니고, 린트하면 경고 1,100건이 실제 경고를 덮는다.
    "public/maplibre-gl-worker.mjs",
  ]),
  {
    rules: {
      // useEffect 안에서 setState 호출은 흔한 패턴 — error → warn
      "react-hooks/set-state-in-effect": "warn",
      // useCallback 내부 참조 순서 — error → warn
      "react-hooks/immutability": "warn",
    },
  },
]);

export default eslintConfig;
