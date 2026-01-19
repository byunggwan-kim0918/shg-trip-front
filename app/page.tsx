"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [result, setResult] = useState<string>("loading...");

  useEffect (() => {
    (async () => {
      try {
        const response = await fetch("/api/auth/login", {cache: "no-store"});
        const text = await response.text();
        setResult(text);
      } catch (e:any) {
        setResult(`error: ${e?.message ?? "unknown"}`);
      }
    })();
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>shg-trip-front 서혜관 프로젝트</h1>
    </main>
  );
}
