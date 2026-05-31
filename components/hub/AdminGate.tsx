"use client";

import { useCallback, useEffect, useState } from "react";
import { LockKeyhole, LogOut } from "lucide-react";

export const ADMIN_STORAGE_KEY = "saltrock_hub_admin_password";

interface AdminGateRenderProps {
  adminPassword: string;
  logout: () => void;
}

interface AdminGateProps {
  title: string;
  description: string;
  children: (props: AdminGateRenderProps) => React.ReactNode;
}

async function verifyPassword(password: string) {
  const response = await fetch("/api/admin-auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });

  const payload = (await response.json()) as { ok?: boolean; message?: string };
  return {
    ok: Boolean(response.ok && payload.ok),
    message: payload.message ?? "관리자 인증에 실패했습니다.",
  };
}

export function AdminGate({ title, description, children }: AdminGateProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const logout = useCallback(() => {
    sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    setAdminPassword("");
    setIsAuthenticated(false);
    setLoginPassword("");
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const saved = sessionStorage.getItem(ADMIN_STORAGE_KEY);
      if (!saved) {
        if (!cancelled) {
          setIsChecking(false);
        }
        return;
      }

      const result = await verifyPassword(saved);
      if (cancelled) {
        return;
      }

      if (result.ok) {
        setAdminPassword(saved);
        setIsAuthenticated(true);
      } else {
        sessionStorage.removeItem(ADMIN_STORAGE_KEY);
        setErrorMessage("저장된 관리자 인증이 만료되었습니다. 다시 로그인해 주세요.");
      }
      setIsChecking(false);
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!loginPassword.trim()) {
      setErrorMessage("관리자 비밀번호를 입력해 주세요.");
      return;
    }

    setIsLoggingIn(true);
    setErrorMessage("");
    try {
      const result = await verifyPassword(loginPassword.trim());
      if (!result.ok) {
        setErrorMessage(result.message);
        return;
      }

      sessionStorage.setItem(ADMIN_STORAGE_KEY, loginPassword.trim());
      setAdminPassword(loginPassword.trim());
      setLoginPassword("");
      setIsAuthenticated(true);
    } catch {
      setErrorMessage("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isChecking) {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-20 text-center sm:px-6">
        <p className="text-sm font-semibold text-brand-primary/80">관리자 인증 확인 중...</p>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-brand-primary/12 bg-white p-6 shadow-soft md:p-8">
          <div className="mb-6 text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-cream px-3 py-1 text-xs font-semibold text-brand-primary">
              <LockKeyhole className="h-4 w-4" aria-hidden />
              SaltRock 관리자
            </p>
            <h1 className="mt-3 font-heading text-3xl font-black text-brand-primary">{title}</h1>
            <p className="mt-2 text-sm text-foreground/80">{description}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block text-sm font-semibold text-foreground/90">
              관리자 비밀번호
              <input
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-brand-primary/15 px-3 py-3 text-sm outline-none ring-brand-secondary focus:ring-2"
                placeholder="ADMIN_PASSWORD를 입력해 주세요"
                autoComplete="current-password"
              />
            </label>
            {errorMessage ? (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                {errorMessage}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="inline-flex w-full items-center justify-center rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:bg-brand-primary/50"
            >
              {isLoggingIn ? "인증 중..." : "관리자 로그인"}
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <div>
      <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-primary/20 bg-white px-3 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-cream"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            로그아웃
          </button>
        </div>
      </div>
      {children({ adminPassword, logout })}
    </div>
  );
}
