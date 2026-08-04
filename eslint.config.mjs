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
