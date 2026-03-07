'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "로그인에 실패했습니다");
            }
            
            router.push("/main");
        } catch (err) {
            setError(err instanceof Error ? err.message : "로그인에 실패했습니다");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Title */}
            <div className="text-center mb-12">
                <h1 className="text-5xl font-semibold text-gray-900 mb-4">
                    여행을 시작하세요
                </h1>
                <p className="text-lg text-gray-600">
                    AI가 당신만의 완벽한 여행을 계획해드립니다
                </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="이메일"
                    required
                    className="w-full px-5 py-4 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-base"
                />

                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호"
                    required
                    className="w-full px-5 py-4 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-base"
                />

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white font-medium py-4 px-4 rounded-xl transition-colors duration-200 text-base"
                >
                    {isLoading ? "로그인 중..." : "로그인"}
                </button>
            </form>

            {/* Footer text */}
            <div className="text-center mt-8">
                <p className="text-sm text-gray-600">
                    계정이 없으신가요?{" "}
                    <a 
                        href="/auth/signup" 
                        className="text-teal-600 hover:text-teal-700 hover:underline font-medium"
                    >
                        회원가입
                    </a>
                </p>
            </div>
        </div>
    );
}
