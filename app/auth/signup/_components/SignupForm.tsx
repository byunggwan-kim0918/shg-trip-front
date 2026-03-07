'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PasswordStrength {
  score: number;
  message: string;
  color: string;
}

export function SignupForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [nickname, setNickname] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const checkPasswordStrength = (pwd: string): PasswordStrength => {
        if (pwd.length === 0) return { score: 0, message: "", color: "" };
        if (pwd.length < 8) return { score: 1, message: "8자 이상 입력하세요", color: "bg-red-500" };
        
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
        const hasNumber = /\d/.test(pwd);
        const hasUpperCase = /[A-Z]/.test(pwd);
        const hasLowerCase = /[a-z]/.test(pwd);
        
        if (!hasSpecialChar) return { score: 2, message: "특수문자를 포함하세요", color: "bg-orange-500" };
        
        const strength = [hasNumber, hasUpperCase, hasLowerCase].filter(Boolean).length;
        if (strength < 2) return { score: 3, message: "보통", color: "bg-yellow-500" };
        if (strength === 2) return { score: 4, message: "강함", color: "bg-green-500" };
        return { score: 5, message: "매우 강함", color: "bg-green-600" };
    };

    const passwordStrength = checkPasswordStrength(password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("비밀번호가 일치하지 않습니다");
            return;
        }

        if (passwordStrength.score < 2) {
            setError("비밀번호는 8자 이상, 특수문자를 포함해야 합니다");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, nickname }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "회원가입에 실패했습니다");
            }
            
            router.push("/auth/login?signup=success");
        } catch (err) {
            setError(err instanceof Error ? err.message : "회원가입에 실패했습니다");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Title */}
            <div className="text-center mb-12">
                <h1 className="text-5xl font-semibold text-gray-900 mb-4">
                    계정 만들기
                </h1>
                <p className="text-lg text-gray-600">
                    나만의 여행 이야기를 시작하세요
                </p>
            </div>

            {/* Signup Form */}
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
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="닉네임"
                    required
                    maxLength={50}
                    className="w-full px-5 py-4 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-base"
                />

                <div>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="비밀번호 (8자 이상, 특수문자 포함)"
                        required
                        className="w-full px-5 py-4 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-base"
                    />
                    {password && (
                        <div className="mt-2 space-y-1">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((level) => (
                                    <div
                                        key={level}
                                        className={`h-1 flex-1 rounded-full transition-colors ${
                                            level <= passwordStrength.score
                                                ? passwordStrength.color
                                                : "bg-gray-200"
                                        }`}
                                    />
                                ))}
                            </div>
                            <p className="text-xs text-gray-600">
                                {passwordStrength.message}
                            </p>
                        </div>
                    )}
                </div>

                <div>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="비밀번호 확인"
                        required
                        className="w-full px-5 py-4 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-base"
                    />
                    {confirmPassword && password !== confirmPassword && (
                        <p className="mt-2 text-xs text-red-600">
                            비밀번호가 일치하지 않습니다
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white font-medium py-4 px-4 rounded-xl transition-colors duration-200 text-base"
                >
                    {isLoading ? "가입 중..." : "회원가입"}
                </button>
            </form>

            {/* Footer text */}
            <div className="text-center mt-8">
                <p className="text-sm text-gray-600">
                    이미 계정이 있으신가요?{" "}
                    <a 
                        href="/auth/login" 
                        className="text-teal-600 hover:text-teal-700 hover:underline font-medium"
                    >
                        로그인
                    </a>
                </p>
            </div>
        </div>
    );
}
