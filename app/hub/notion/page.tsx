"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Database, RefreshCw, RotateCcw, Wrench } from "lucide-react";
import { AdminGate } from "@/components/hub/AdminGate";

interface NotionStatusResponse {
  ok: boolean;
  setupStatus?: {
    configured: boolean;
    parentPageId: string;
    mapRows: Array<{ key: string; notion_database_id: string; name: string | null }>;
    mapError: string | null;
  };
  unsyncedCounts?: {
    galleryAlbums: number;
    galleryPhotos: number;
    inquiries: number;
    calendarEvents: number;
  };
  queryErrors?: string[];
  message?: string;
}

function HubNotionContent({ adminPassword }: { adminPassword: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<NotionStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [syncResults, setSyncResults] = useState<Array<Record<string, unknown>>>([]);

  const authorizedFetch = async (url: string, init?: RequestInit) => {
    const headers = new Headers(init?.headers ?? {});
    headers.set("x-admin-password", adminPassword);
    return fetch(url, { ...init, headers, cache: "no-store" });
  };

  const loadStatus = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await authorizedFetch("/api/hub/notion/status");
      const payload = (await response.json()) as NotionStatusResponse;
      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.message ?? "Notion 상태 조회에 실패했습니다.");
        return;
      }
      setStatus(payload);
    } catch {
      setErrorMessage("Notion 상태 조회 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminPassword]);

  const runSetup = async () => {
    setIsSettingUp(true);
    setMessage("");
    setErrorMessage("");
    try {
      const response = await authorizedFetch("/api/hub/notion/setup", {
        method: "POST",
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        results?: Array<Record<string, unknown>>;
      };

      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.message ?? "Notion DB 설정에 실패했습니다.");
        return;
      }

      setMessage(payload.message ?? "Notion DB 설정이 완료되었습니다.");
      setSyncResults(payload.results ?? []);
      await loadStatus();
      router.refresh();
    } catch {
      setErrorMessage("Notion DB 설정 중 오류가 발생했습니다.");
    } finally {
      setIsSettingUp(false);
    }
  };

  const runSync = async (onlyFailed: boolean) => {
    setIsSyncing(true);
    setMessage("");
    setErrorMessage("");
    try {
      const response = await authorizedFetch("/api/hub/notion/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onlyFailed }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        results?: Array<Record<string, unknown>>;
      };

      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.message ?? "동기화에 실패했습니다.");
        setSyncResults(payload.results ?? []);
        return;
      }

      setMessage(payload.message ?? "동기화가 완료되었습니다.");
      setSyncResults(payload.results ?? []);
      await loadStatus();
      router.refresh();
    } catch {
      setErrorMessage("동기화 중 오류가 발생했습니다.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="rounded-3xl border border-brand-primary/12 bg-white p-5 shadow-soft md:p-6">
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-cream px-3 py-1 text-xs font-semibold text-brand-primary">
          <Database className="h-4 w-4" aria-hidden />
          Notion Sync Hub
        </p>
        <h1 className="mt-2 font-heading text-3xl font-black text-brand-primary">Notion 연동 상태</h1>
        <p className="mt-2 text-sm text-foreground/80">
          NOTION_PAGE_ID 하위 DB 생성 여부를 확인하고 Supabase 데이터를 동기화할 수 있습니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/hub/gallery"
            className="rounded-lg border border-brand-primary/20 bg-white px-3 py-1.5 text-sm font-semibold text-brand-primary hover:bg-brand-cream"
          >
            갤러리 관리로 이동
          </Link>
          <button
            type="button"
            onClick={() => void loadStatus()}
            className="inline-flex items-center gap-1 rounded-lg border border-brand-primary/20 bg-white px-3 py-1.5 text-sm font-semibold text-brand-primary hover:bg-brand-cream"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            상태 새로고침
          </button>
        </div>
      </header>

      {errorMessage ? (
        <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {errorMessage}
        </p>
      ) : null}
      {message ? (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          {message}
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <article className="rounded-3xl border border-brand-primary/12 bg-white p-5 shadow-soft lg:col-span-5">
          <h2 className="text-lg font-extrabold text-brand-primary">연결 상태</h2>
          {isLoading ? (
            <p className="mt-4 text-sm text-foreground/75">상태 조회 중...</p>
          ) : (
            <div className="mt-4 space-y-2 text-sm">
              <p>
                <span className="font-semibold text-brand-primary">Notion 환경변수:</span>{" "}
                {status?.setupStatus?.configured ? "설정됨" : "미설정"}
              </p>
              <p className="break-all">
                <span className="font-semibold text-brand-primary">NOTION_PAGE_ID:</span>{" "}
                {status?.setupStatus?.parentPageId || "-"}
              </p>
              <p>
                <span className="font-semibold text-brand-primary">Unsynced:</span> Albums{" "}
                {status?.unsyncedCounts?.galleryAlbums ?? 0} / Photos{" "}
                {status?.unsyncedCounts?.galleryPhotos ?? 0} / Inquiries{" "}
                {status?.unsyncedCounts?.inquiries ?? 0} / Calendar{" "}
                {status?.unsyncedCounts?.calendarEvents ?? 0}
              </p>
              {status?.setupStatus?.mapError ? (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  notion_database_map 조회 오류: {status.setupStatus.mapError}
                </p>
              ) : null}
              {status?.queryErrors && status.queryErrors.length > 0 ? (
                <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  {status.queryErrors.map((error) => (
                    <p key={error}>{error}</p>
                  ))}
                </div>
              ) : null}
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void runSetup()}
              disabled={isSettingUp}
              className="inline-flex items-center gap-1 rounded-lg bg-brand-primary px-3 py-2 text-sm font-semibold text-white hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:bg-brand-primary/50"
            >
              <Wrench className="h-4 w-4" aria-hidden />
              {isSettingUp ? "설정 중..." : "Notion DB 자동 생성/확인"}
            </button>
            <button
              type="button"
              onClick={() => void runSync(false)}
              disabled={isSyncing}
              className="inline-flex items-center gap-1 rounded-lg border border-brand-primary/20 px-3 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-cream disabled:cursor-not-allowed"
            >
              {isSyncing ? "동기화 중..." : "전체 동기화"}
            </button>
            <button
              type="button"
              onClick={() => void runSync(true)}
              disabled={isSyncing}
              className="inline-flex items-center gap-1 rounded-lg border border-brand-primary/20 px-3 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-cream disabled:cursor-not-allowed"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              실패 항목 재동기화
            </button>
          </div>
        </article>

        <article className="rounded-3xl border border-brand-primary/12 bg-white p-5 shadow-soft lg:col-span-7">
          <h2 className="text-lg font-extrabold text-brand-primary">notion_database_map</h2>
          {!status?.setupStatus?.mapRows?.length ? (
            <p className="mt-4 rounded-2xl border border-dashed border-brand-primary/20 bg-brand-cream p-4 text-sm text-foreground/80">
              아직 저장된 Notion DB 매핑이 없습니다.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-brand-primary/15 text-brand-primary">
                    <th className="py-2 pr-3">Key</th>
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Database ID</th>
                  </tr>
                </thead>
                <tbody>
                  {status.setupStatus.mapRows.map((row) => (
                    <tr key={row.key} className="border-b border-brand-primary/10">
                      <td className="py-2 pr-3 font-semibold text-brand-primary">{row.key}</td>
                      <td className="py-2 pr-3">{row.name ?? "-"}</td>
                      <td className="py-2 pr-3 break-all">{row.notion_database_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {syncResults.length > 0 ? (
            <div className="mt-5">
              <h3 className="text-sm font-bold text-brand-primary">최근 동기화 결과</h3>
              <div className="mt-2 max-h-72 overflow-auto rounded-xl border border-brand-primary/10 bg-brand-cream/60 p-3 text-xs">
                {syncResults.map((result, index) => (
                  <pre key={`${index}-${result.id ?? "-"}`} className="mb-2 whitespace-pre-wrap">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                ))}
              </div>
            </div>
          ) : null}
        </article>
      </div>
    </section>
  );
}

export default function HubNotionPage() {
  return (
    <AdminGate
      title="Notion 연동 관리"
      description="Notion DB 생성 여부 확인과 동기화를 관리할 수 있습니다."
    >
      {({ adminPassword }) => <HubNotionContent adminPassword={adminPassword} />}
    </AdminGate>
  );
}
