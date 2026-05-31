"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarDays, Database, Images, Save } from "lucide-react";
import { AdminGate } from "@/components/hub/AdminGate";
import type { InquiryLifecycleStatus } from "@/lib/types";

interface InquiryRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  programSlug: string | null;
  programInterest: string;
  message: string;
  status: InquiryLifecycleStatus;
  adminMemo: string | null;
  createdAt: string;
}

interface InquiryDraft {
  status: InquiryLifecycleStatus;
  adminMemo: string;
}

const statusOptions: Array<{ value: InquiryLifecycleStatus; label: string }> = [
  { value: "new", label: "신규" },
  { value: "contacted", label: "연락완료" },
  { value: "confirmed", label: "확정대기" },
  { value: "completed", label: "완료" },
  { value: "cancelled", label: "취소" },
];

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
}

function HubHomeContent({ adminPassword }: { adminPassword: string }) {
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [inquiryDrafts, setInquiryDrafts] = useState<Record<string, InquiryDraft>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [savingInquiryId, setSavingInquiryId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const authorizedFetch = async (url: string, init?: RequestInit) => {
    const headers = new Headers(init?.headers ?? {});
    headers.set("x-admin-password", adminPassword);
    return fetch(url, {
      ...init,
      headers,
      cache: "no-store",
    });
  };

  const loadInquiries = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await authorizedFetch("/api/inquiries");
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        items?: InquiryRow[];
      };

      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.message ?? "문의 목록을 불러오지 못했습니다.");
        return;
      }

      const items = payload.items ?? [];
      setInquiries(items);
      setInquiryDrafts(
        Object.fromEntries(
          items.map((inquiry) => [
            inquiry.id,
            {
              status: inquiry.status,
              adminMemo: inquiry.adminMemo ?? "",
            },
          ]),
        ),
      );
    } catch {
      setErrorMessage("문의 목록 조회 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadInquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminPassword]);

  const inquirySummary = useMemo(() => {
    return inquiries.reduce<Record<InquiryLifecycleStatus, number>>(
      (acc, inquiry) => {
        acc[inquiry.status] = (acc[inquiry.status] ?? 0) + 1;
        return acc;
      },
      {
        new: 0,
        contacted: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
      },
    );
  }, [inquiries]);

  const saveInquiry = async (id: string) => {
    const draft = inquiryDrafts[id];
    if (!draft) {
      return;
    }

    setSavingInquiryId(id);
    setMessage("");
    setErrorMessage("");
    try {
      const response = await authorizedFetch("/api/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: draft.status,
          adminMemo: draft.adminMemo,
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.message ?? "문의 수정에 실패했습니다.");
        return;
      }

      setMessage(payload.message ?? "문의가 수정되었습니다.");
      await loadInquiries();
    } catch {
      setErrorMessage("문의 수정 중 오류가 발생했습니다.");
    } finally {
      setSavingInquiryId("");
    }
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="rounded-3xl border border-brand-primary/12 bg-white p-5 shadow-soft md:p-6">
        <h1 className="font-heading text-3xl font-black text-brand-primary">관리자 허브</h1>
        <p className="mt-2 text-sm text-foreground/80">
          문의, 갤러리, 캘린더, Notion 연동 상태를 한 곳에서 관리합니다.
        </p>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link
          href="/hub/gallery"
          className="rounded-2xl border border-brand-primary/12 bg-white p-4 shadow-soft transition hover:-translate-y-0.5"
        >
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary">
            <Images className="h-4 w-4" aria-hidden />
            갤러리 관리
          </p>
          <p className="mt-2 text-sm text-foreground/75">앨범/사진 등록, 공개 설정, 업로드 관리</p>
        </Link>
        <Link
          href="/hub/calendar"
          className="rounded-2xl border border-brand-primary/12 bg-white p-4 shadow-soft transition hover:-translate-y-0.5"
        >
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary">
            <CalendarDays className="h-4 w-4" aria-hidden />
            일정 관리
          </p>
          <p className="mt-2 text-sm text-foreground/75">공개 일정 생성/수정/삭제</p>
        </Link>
        <Link
          href="/hub/notion"
          className="rounded-2xl border border-brand-primary/12 bg-white p-4 shadow-soft transition hover:-translate-y-0.5"
        >
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary">
            <Database className="h-4 w-4" aria-hidden />
            Notion 연동 관리
          </p>
          <p className="mt-2 text-sm text-foreground/75">DB 자동 생성, 전체 동기화, 실패 재동기화</p>
        </Link>
      </div>

      <section className="mt-6 rounded-3xl border border-brand-primary/12 bg-white p-5 shadow-soft md:p-6">
        <h2 className="inline-flex items-center gap-2 text-lg font-extrabold text-brand-primary">
          <BarChart3 className="h-5 w-5" aria-hidden />
          문의 관리
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
          {statusOptions.map((option) => (
            <div
              key={option.value}
              className="rounded-xl border border-brand-primary/10 bg-brand-cream p-3"
            >
              <p className="text-xs font-semibold text-brand-primary/80">{option.label}</p>
              <p className="mt-1 text-lg font-black text-brand-primary">
                {inquirySummary[option.value] ?? 0}
              </p>
            </div>
          ))}
        </div>

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

        {isLoading ? (
          <p className="mt-4 text-sm text-foreground/75">문의 목록을 불러오는 중...</p>
        ) : inquiries.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-brand-primary/20 bg-brand-cream p-4 text-sm text-foreground/80">
            등록된 문의가 없습니다.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {inquiries.map((item) => {
              const draft = inquiryDrafts[item.id];
              if (!draft) {
                return null;
              }

              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-brand-primary/10 bg-white p-4"
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.1fr_1fr]">
                    <div>
                      <p className="text-xs font-semibold text-brand-primary/80">
                        접수일 {formatDateTime(item.createdAt)}
                      </p>
                      <h3 className="mt-1 text-base font-bold text-brand-primary">
                        {item.name} ({item.phone})
                      </h3>
                      <p className="mt-1 text-sm text-foreground/80">
                        프로그램: {item.programSlug || item.programInterest || "-"}
                      </p>
                      {item.email ? (
                        <p className="mt-1 text-xs text-foreground/70">이메일: {item.email}</p>
                      ) : null}
                      <p className="mt-2 rounded-lg bg-brand-cream px-3 py-2 text-sm text-foreground/85">
                        {item.message}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground/80">
                        상태
                        <select
                          value={draft.status}
                          onChange={(event) =>
                            setInquiryDrafts((prev) => ({
                              ...prev,
                              [item.id]: {
                                ...draft,
                                status: event.target.value as InquiryLifecycleStatus,
                              },
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-brand-primary/15 px-2.5 py-2 text-sm"
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="mt-3 block text-xs font-semibold text-foreground/80">
                        관리자 메모
                        <textarea
                          value={draft.adminMemo}
                          onChange={(event) =>
                            setInquiryDrafts((prev) => ({
                              ...prev,
                              [item.id]: {
                                ...draft,
                                adminMemo: event.target.value,
                              },
                            }))
                          }
                          className="mt-1 min-h-20 w-full rounded-lg border border-brand-primary/15 px-2.5 py-2 text-sm"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => void saveInquiry(item.id)}
                        disabled={savingInquiryId === item.id}
                        className="mt-3 inline-flex items-center gap-1 rounded-lg border border-brand-primary/20 px-3 py-1.5 text-xs font-semibold text-brand-primary hover:bg-brand-cream disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Save className="h-3.5 w-3.5" aria-hidden />
                        {savingInquiryId === item.id ? "저장 중..." : "상태/메모 저장"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}

export default function HubPage() {
  return (
    <AdminGate
      title="관리자 허브"
      description="문의, 갤러리, 캘린더, Notion 연동 관리에 접근할 수 있습니다."
    >
      {({ adminPassword }) => <HubHomeContent adminPassword={adminPassword} />}
    </AdminGate>
  );
}
