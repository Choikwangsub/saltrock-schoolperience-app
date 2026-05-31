"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  ImagePlus,
  LockKeyhole,
  LogOut,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import type { CalendarEventItem, InquiryLifecycleStatus, InquiryRecord } from "@/lib/types";

const ADMIN_STORAGE_KEY = "saltrock_hub_admin_password";

type HubTab = "inquiries" | "calendar" | "gallery-guide";

interface InquiryDraft {
  status: InquiryLifecycleStatus;
  adminMemo: string;
}

interface CalendarFormState {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  programName: string;
  organizationName: string;
  location: string;
  status: string;
  memo: string;
  isPublic: boolean;
}

const inquiryStatusOptions: Array<{ value: InquiryLifecycleStatus; label: string }> = [
  { value: "new", label: "신규" },
  { value: "contacted", label: "연락완료" },
  { value: "confirmed", label: "확정대기" },
  { value: "completed", label: "진행완료" },
  { value: "cancelled", label: "취소" },
];

const calendarStatusOptions = [
  { value: "scheduled", label: "예정" },
  { value: "pending", label: "조율중" },
  { value: "confirmed", label: "확정" },
  { value: "completed", label: "완료" },
  { value: "cancelled", label: "취소" },
];

const emptyCalendarForm: CalendarFormState = {
  title: "",
  date: "",
  startTime: "",
  endTime: "",
  programName: "",
  organizationName: "",
  location: "",
  status: "scheduled",
  memo: "",
  isPublic: false,
};

function formatDateTime(value: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDateOnly(value: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
  }).format(date);
}

export default function HubPage() {
  const [activeTab, setActiveTab] = useState<HubTab>("inquiries");

  const [loginPassword, setLoginPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [inquiryDrafts, setInquiryDrafts] = useState<Record<string, InquiryDraft>>({});
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(false);
  const [inquiryError, setInquiryError] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [savingInquiryId, setSavingInquiryId] = useState<string | null>(null);

  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [eventDrafts, setEventDrafts] = useState<Record<string, CalendarFormState>>({});
  const [calendarForm, setCalendarForm] = useState<CalendarFormState>(emptyCalendarForm);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [calendarError, setCalendarError] = useState("");
  const [calendarMessage, setCalendarMessage] = useState("");
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [savingEventId, setSavingEventId] = useState<string | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  const resetAdminSession = useCallback(() => {
    sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    setAdminPassword("");
    setIsAuthenticated(false);
    setLoginPassword("");
  }, []);

  const verifyAdminPassword = useCallback(async (password: string) => {
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
      status: response.status,
    };
  }, []);

  const authorizedFetch = useCallback(
    async (url: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers ?? {});
      headers.set("x-admin-password", adminPassword);

      return fetch(url, {
        ...init,
        headers,
        cache: "no-store",
      });
    },
    [adminPassword],
  );

  const handleUnauthorized = useCallback(() => {
    setAuthError("관리자 인증이 만료되었습니다. 비밀번호를 다시 입력해 주세요.");
    resetAdminSession();
  }, [resetAdminSession]);

  const loadInquiries = useCallback(async () => {
    if (!adminPassword) {
      return;
    }

    setIsLoadingInquiries(true);
    setInquiryError("");

    try {
      const response = await authorizedFetch("/api/inquiries");
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        items?: InquiryRecord[];
      };

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !payload.ok) {
        setInquiryError(payload.message ?? "문의 목록을 불러오지 못했습니다.");
        return;
      }

      const loadedItems = payload.items ?? [];
      setInquiries(loadedItems);
      setInquiryDrafts(
        Object.fromEntries(
          loadedItems.map((item) => [
            item.id,
            {
              status: item.status,
              adminMemo: item.adminMemo ?? "",
            },
          ]),
        ),
      );
    } catch {
      setInquiryError("문의 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoadingInquiries(false);
    }
  }, [adminPassword, authorizedFetch, handleUnauthorized]);

  const loadCalendarEvents = useCallback(async () => {
    if (!adminPassword) {
      return;
    }

    setIsLoadingEvents(true);
    setCalendarError("");

    try {
      const response = await authorizedFetch("/api/calendar");
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        items?: CalendarEventItem[];
      };

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !payload.ok) {
        setCalendarError(payload.message ?? "일정을 불러오지 못했습니다.");
        return;
      }

      const loadedItems = payload.items ?? [];
      setEvents(loadedItems);
      setEventDrafts(
        Object.fromEntries(
          loadedItems.map((item) => [
            item.id,
            {
              title: item.title,
              date: item.date,
              startTime: item.startTime ?? "",
              endTime: item.endTime ?? "",
              programName: item.programName ?? "",
              organizationName: item.organizationName ?? "",
              location: item.location ?? "",
              status: item.status || "scheduled",
              memo: item.memo ?? "",
              isPublic: Boolean(item.isPublic),
            },
          ]),
        ),
      );
    } catch {
      setCalendarError("일정을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoadingEvents(false);
    }
  }, [adminPassword, authorizedFetch, handleUnauthorized]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const saved = sessionStorage.getItem(ADMIN_STORAGE_KEY);
      if (!saved) {
        if (!cancelled) {
          setIsCheckingSession(false);
        }
        return;
      }

      try {
        const verified = await verifyAdminPassword(saved);
        if (cancelled) {
          return;
        }
        if (verified.ok) {
          setAdminPassword(saved);
          setIsAuthenticated(true);
          setAuthError("");
        } else {
          sessionStorage.removeItem(ADMIN_STORAGE_KEY);
          setAuthError("저장된 관리자 인증이 만료되었습니다. 다시 로그인해 주세요.");
        }
      } finally {
        if (!cancelled) {
          setIsCheckingSession(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [verifyAdminPassword]);

  useEffect(() => {
    if (!isAuthenticated || !adminPassword) {
      return;
    }

    void loadInquiries();
    void loadCalendarEvents();
  }, [adminPassword, isAuthenticated, loadCalendarEvents, loadInquiries]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!loginPassword.trim()) {
      setAuthError("관리자 비밀번호를 입력해 주세요.");
      return;
    }

    setIsLoggingIn(true);
    setAuthError("");
    try {
      const verified = await verifyAdminPassword(loginPassword.trim());
      if (!verified.ok) {
        setAuthError(verified.message);
        return;
      }

      sessionStorage.setItem(ADMIN_STORAGE_KEY, loginPassword.trim());
      setAdminPassword(loginPassword.trim());
      setIsAuthenticated(true);
      setLoginPassword("");
    } catch {
      setAuthError("로그인 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    resetAdminSession();
    setInquiries([]);
    setInquiryDrafts({});
    setEvents([]);
    setEventDrafts({});
    setActiveTab("inquiries");
  };

  const saveInquiry = async (id: string) => {
    const draft = inquiryDrafts[id];
    if (!draft) {
      return;
    }

    setSavingInquiryId(id);
    setInquiryError("");
    setInquiryMessage("");

    try {
      const response = await authorizedFetch("/api/inquiries", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          status: draft.status,
          adminMemo: draft.adminMemo,
        }),
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !payload.ok) {
        setInquiryError(payload.message ?? "문의 정보를 저장하지 못했습니다.");
        return;
      }

      setInquiryMessage(payload.message ?? "문의 정보가 저장되었습니다.");
      await loadInquiries();
    } catch {
      setInquiryError("문의 저장 중 오류가 발생했습니다.");
    } finally {
      setSavingInquiryId(null);
    }
  };

  const createEvent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!calendarForm.title.trim() || !calendarForm.date.trim()) {
      setCalendarError("일정 제목과 날짜는 필수 입력입니다.");
      return;
    }

    setIsCreatingEvent(true);
    setCalendarError("");
    setCalendarMessage("");

    try {
      const response = await authorizedFetch("/api/calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(calendarForm),
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !payload.ok) {
        setCalendarError(payload.message ?? "일정을 추가하지 못했습니다.");
        return;
      }

      setCalendarMessage(payload.message ?? "일정이 추가되었습니다.");
      setCalendarForm(emptyCalendarForm);
      await loadCalendarEvents();
    } catch {
      setCalendarError("일정 추가 중 오류가 발생했습니다.");
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const saveEvent = async (id: string) => {
    const draft = eventDrafts[id];
    if (!draft) {
      return;
    }

    if (!draft.title.trim() || !draft.date.trim()) {
      setCalendarError("일정 제목과 날짜는 필수 입력입니다.");
      return;
    }

    setSavingEventId(id);
    setCalendarError("");
    setCalendarMessage("");

    try {
      const response = await authorizedFetch("/api/calendar", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          ...draft,
        }),
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !payload.ok) {
        setCalendarError(payload.message ?? "일정을 수정하지 못했습니다.");
        return;
      }

      setCalendarMessage(payload.message ?? "일정이 수정되었습니다.");
      await loadCalendarEvents();
    } catch {
      setCalendarError("일정 수정 중 오류가 발생했습니다.");
    } finally {
      setSavingEventId(null);
    }
  };

  const deleteEvent = async (id: string) => {
    const confirmed = window.confirm("이 일정을 삭제하시겠습니까?");
    if (!confirmed) {
      return;
    }

    setDeletingEventId(id);
    setCalendarError("");
    setCalendarMessage("");

    try {
      const response = await authorizedFetch("/api/calendar", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !payload.ok) {
        setCalendarError(payload.message ?? "일정을 삭제하지 못했습니다.");
        return;
      }

      setCalendarMessage(payload.message ?? "일정이 삭제되었습니다.");
      await loadCalendarEvents();
    } catch {
      setCalendarError("일정 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingEventId(null);
    }
  };

  const inquiryCountLabel = useMemo(() => `${inquiries.length}건`, [inquiries.length]);
  const eventCountLabel = useMemo(() => `${events.length}건`, [events.length]);

  if (isCheckingSession) {
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
              SaltRock 관리자 허브
            </p>
            <h1 className="mt-3 font-heading text-3xl font-black text-brand-primary">
              관리자 로그인
            </h1>
            <p className="mt-2 text-sm text-foreground/80">
              문의 관리와 일정 관리를 위해 관리자 비밀번호를 입력해 주세요.
            </p>
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

            {authError ? (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                {authError}
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
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="rounded-3xl border border-brand-primary/12 bg-white p-5 shadow-soft md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-black text-brand-primary">관리자 허브</h1>
            <p className="mt-1 text-sm text-foreground/80">
              문의 DB와 운영 캘린더를 한 화면에서 관리할 수 있습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void loadInquiries();
                void loadCalendarEvents();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-brand-primary/20 bg-white px-3 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-cream"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              새로고침
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-brand-primary/20 bg-white px-3 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-cream"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <button
          type="button"
          onClick={() => setActiveTab("inquiries")}
          className={`rounded-2xl border p-4 text-left transition ${
            activeTab === "inquiries"
              ? "border-brand-primary bg-brand-primary text-white"
              : "border-brand-primary/15 bg-white text-brand-primary hover:bg-brand-cream"
          }`}
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <ClipboardList className="h-4 w-4" aria-hidden />
            문의 관리
          </span>
          <p className="mt-1 text-xs opacity-90">현재 {inquiryCountLabel}</p>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("calendar")}
          className={`rounded-2xl border p-4 text-left transition ${
            activeTab === "calendar"
              ? "border-brand-primary bg-brand-primary text-white"
              : "border-brand-primary/15 bg-white text-brand-primary hover:bg-brand-cream"
          }`}
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <CalendarDays className="h-4 w-4" aria-hidden />
            캘린더
          </span>
          <p className="mt-1 text-xs opacity-90">현재 {eventCountLabel}</p>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("gallery-guide")}
          className={`rounded-2xl border p-4 text-left transition ${
            activeTab === "gallery-guide"
              ? "border-brand-primary bg-brand-primary text-white"
              : "border-brand-primary/15 bg-white text-brand-primary hover:bg-brand-cream"
          }`}
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <ImagePlus className="h-4 w-4" aria-hidden />
            갤러리 관리 안내
          </span>
          <p className="mt-1 text-xs opacity-90">Notion + 로컬 이미지 안내</p>
        </button>
      </div>

      {activeTab === "inquiries" ? (
        <section className="mt-6 rounded-3xl border border-brand-primary/12 bg-white p-5 shadow-soft md:p-6">
          <h2 className="text-xl font-extrabold text-brand-primary">문의 관리</h2>
          <p className="mt-1 text-sm text-foreground/80">
            신규 문의를 확인하고 상태 및 관리자 메모를 업데이트할 수 있습니다.
          </p>

          {inquiryError ? (
            <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              {inquiryError}
            </p>
          ) : null}
          {inquiryMessage ? (
            <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              {inquiryMessage}
            </p>
          ) : null}

          {isLoadingInquiries ? (
            <p className="mt-6 text-sm text-foreground/75">문의 목록을 불러오는 중...</p>
          ) : inquiries.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-dashed border-brand-primary/20 bg-brand-cream p-4 text-sm text-foreground/80">
              등록된 문의가 아직 없습니다.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              {inquiries.map((item) => {
                const draft = inquiryDrafts[item.id] ?? {
                  status: item.status,
                  adminMemo: item.adminMemo ?? "",
                };
                const isSaving = savingInquiryId === item.id;

                return (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-brand-primary/10 bg-brand-cream/60 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-extrabold text-brand-primary">
                          {item.name} | {item.organizationName}
                        </h3>
                        <p className="mt-1 text-xs text-foreground/70">
                          접수일: {formatDateTime(item.createdAt)}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-primary">
                        문의 ID: {item.id.slice(0, 8)}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                      <p>
                        <span className="font-semibold text-brand-primary">연락처:</span> {item.phone}
                      </p>
                      <p>
                        <span className="font-semibold text-brand-primary">이메일:</span>{" "}
                        {item.email || "-"}
                      </p>
                      <p>
                        <span className="font-semibold text-brand-primary">관심 프로그램:</span>{" "}
                        {item.programInterest}
                      </p>
                      <p>
                        <span className="font-semibold text-brand-primary">희망 날짜:</span>{" "}
                        {item.preferredDate || "-"}
                      </p>
                      <p>
                        <span className="font-semibold text-brand-primary">예상 인원:</span>{" "}
                        {item.expectedStudents || "-"}
                      </p>
                    </div>

                    <div className="mt-3 rounded-xl bg-white p-3 text-sm text-foreground/85">
                      <p className="font-semibold text-brand-primary">문의 내용</p>
                      <p className="mt-1 whitespace-pre-line">{item.message}</p>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <label className="text-sm font-semibold text-foreground/90">
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
                          className="mt-1.5 w-full rounded-xl border border-brand-primary/15 bg-white px-3 py-2.5 text-sm outline-none ring-brand-secondary focus:ring-2"
                        >
                          {inquiryStatusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-sm font-semibold text-foreground/90">
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
                          className="mt-1.5 min-h-24 w-full rounded-xl border border-brand-primary/15 bg-white px-3 py-2.5 text-sm outline-none ring-brand-secondary focus:ring-2"
                          placeholder="상담 진행 내용, 후속 조치 등을 기록하세요."
                        />
                      </label>
                    </div>

                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          void saveInquiry(item.id);
                        }}
                        disabled={isSaving}
                        className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:bg-brand-primary/50"
                      >
                        <Save className="h-4 w-4" aria-hidden />
                        {isSaving ? "저장 중..." : "상태/메모 저장"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {activeTab === "calendar" ? (
        <section className="mt-6 space-y-6">
          <article className="rounded-3xl border border-brand-primary/12 bg-white p-5 shadow-soft md:p-6">
            <h2 className="text-xl font-extrabold text-brand-primary">일정 추가</h2>
            <p className="mt-1 text-sm text-foreground/80">
              학교/기관 운영 일정을 등록하고 공개 여부를 설정할 수 있습니다.
            </p>

            <form onSubmit={createEvent} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-sm font-semibold text-foreground/90">
                  일정 제목 *
                  <input
                    value={calendarForm.title}
                    onChange={(event) =>
                      setCalendarForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                    className="mt-1.5 w-full rounded-xl border border-brand-primary/15 px-3 py-2.5 text-sm outline-none ring-brand-secondary focus:ring-2"
                    placeholder="예: 5학년 AI 그림일기 체험"
                  />
                </label>
                <label className="text-sm font-semibold text-foreground/90">
                  날짜 *
                  <input
                    type="date"
                    value={calendarForm.date}
                    onChange={(event) =>
                      setCalendarForm((prev) => ({ ...prev, date: event.target.value }))
                    }
                    className="mt-1.5 w-full rounded-xl border border-brand-primary/15 px-3 py-2.5 text-sm outline-none ring-brand-secondary focus:ring-2"
                  />
                </label>
                <label className="text-sm font-semibold text-foreground/90">
                  시작 시간
                  <input
                    type="time"
                    value={calendarForm.startTime}
                    onChange={(event) =>
                      setCalendarForm((prev) => ({ ...prev, startTime: event.target.value }))
                    }
                    className="mt-1.5 w-full rounded-xl border border-brand-primary/15 px-3 py-2.5 text-sm outline-none ring-brand-secondary focus:ring-2"
                  />
                </label>
                <label className="text-sm font-semibold text-foreground/90">
                  종료 시간
                  <input
                    type="time"
                    value={calendarForm.endTime}
                    onChange={(event) =>
                      setCalendarForm((prev) => ({ ...prev, endTime: event.target.value }))
                    }
                    className="mt-1.5 w-full rounded-xl border border-brand-primary/15 px-3 py-2.5 text-sm outline-none ring-brand-secondary focus:ring-2"
                  />
                </label>
                <label className="text-sm font-semibold text-foreground/90">
                  프로그램명
                  <input
                    value={calendarForm.programName}
                    onChange={(event) =>
                      setCalendarForm((prev) => ({ ...prev, programName: event.target.value }))
                    }
                    className="mt-1.5 w-full rounded-xl border border-brand-primary/15 px-3 py-2.5 text-sm outline-none ring-brand-secondary focus:ring-2"
                    placeholder="예: 하늘그네"
                  />
                </label>
                <label className="text-sm font-semibold text-foreground/90">
                  기관명
                  <input
                    value={calendarForm.organizationName}
                    onChange={(event) =>
                      setCalendarForm((prev) => ({
                        ...prev,
                        organizationName: event.target.value,
                      }))
                    }
                    className="mt-1.5 w-full rounded-xl border border-brand-primary/15 px-3 py-2.5 text-sm outline-none ring-brand-secondary focus:ring-2"
                    placeholder="예: 솔트락초등학교"
                  />
                </label>
                <label className="text-sm font-semibold text-foreground/90">
                  장소
                  <input
                    value={calendarForm.location}
                    onChange={(event) =>
                      setCalendarForm((prev) => ({ ...prev, location: event.target.value }))
                    }
                    className="mt-1.5 w-full rounded-xl border border-brand-primary/15 px-3 py-2.5 text-sm outline-none ring-brand-secondary focus:ring-2"
                    placeholder="예: 체육관"
                  />
                </label>
                <label className="text-sm font-semibold text-foreground/90">
                  상태
                  <select
                    value={calendarForm.status}
                    onChange={(event) =>
                      setCalendarForm((prev) => ({ ...prev, status: event.target.value }))
                    }
                    className="mt-1.5 w-full rounded-xl border border-brand-primary/15 px-3 py-2.5 text-sm outline-none ring-brand-secondary focus:ring-2"
                  >
                    {calendarStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block text-sm font-semibold text-foreground/90">
                메모
                <textarea
                  value={calendarForm.memo}
                  onChange={(event) =>
                    setCalendarForm((prev) => ({ ...prev, memo: event.target.value }))
                  }
                  className="mt-1.5 min-h-24 w-full rounded-xl border border-brand-primary/15 px-3 py-2.5 text-sm outline-none ring-brand-secondary focus:ring-2"
                  placeholder="운영 메모, 준비 사항 등을 기록하세요."
                />
              </label>

              <label className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/90">
                <input
                  type="checkbox"
                  checked={calendarForm.isPublic}
                  onChange={(event) =>
                    setCalendarForm((prev) => ({ ...prev, isPublic: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-brand-primary/25"
                />
                공개 페이지에 일정 노출 (is_public=true)
              </label>

              {calendarError ? (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {calendarError}
                </p>
              ) : null}
              {calendarMessage ? (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                  {calendarMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isCreatingEvent}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:bg-brand-primary/50"
              >
                <Save className="h-4 w-4" aria-hidden />
                {isCreatingEvent ? "추가 중..." : "일정 추가"}
              </button>
            </form>
          </article>

          <article className="rounded-3xl border border-brand-primary/12 bg-white p-5 shadow-soft md:p-6">
            <h2 className="text-xl font-extrabold text-brand-primary">일정 목록</h2>
            <p className="mt-1 text-sm text-foreground/80">
              일정 정보를 수정하거나 삭제할 수 있습니다.
            </p>

            {isLoadingEvents ? (
              <p className="mt-5 text-sm text-foreground/75">일정 목록을 불러오는 중...</p>
            ) : events.length === 0 ? (
              <p className="mt-5 rounded-2xl border border-dashed border-brand-primary/20 bg-brand-cream p-4 text-sm text-foreground/80">
                등록된 일정이 없습니다.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {events.map((eventItem) => {
                  const draft = eventDrafts[eventItem.id] ?? {
                    title: eventItem.title,
                    date: eventItem.date,
                    startTime: eventItem.startTime ?? "",
                    endTime: eventItem.endTime ?? "",
                    programName: eventItem.programName ?? "",
                    organizationName: eventItem.organizationName ?? "",
                    location: eventItem.location ?? "",
                    status: eventItem.status || "scheduled",
                    memo: eventItem.memo ?? "",
                    isPublic: Boolean(eventItem.isPublic),
                  };
                  const isSaving = savingEventId === eventItem.id;
                  const isDeleting = deletingEventId === eventItem.id;

                  return (
                    <article
                      key={eventItem.id}
                      className="rounded-2xl border border-brand-primary/10 bg-brand-cream/60 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-extrabold text-brand-primary">
                            {eventItem.title}
                          </h3>
                          <p className="mt-1 text-xs text-foreground/70">
                            등록일: {formatDateTime(eventItem.createdAt)}
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-primary">
                          일정일: {formatDateOnly(eventItem.date)}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <label className="text-sm font-semibold text-foreground/90">
                          일정 제목
                          <input
                            value={draft.title}
                            onChange={(inputEvent) =>
                              setEventDrafts((prev) => ({
                                ...prev,
                                [eventItem.id]: {
                                  ...draft,
                                  title: inputEvent.target.value,
                                },
                              }))
                            }
                            className="mt-1.5 w-full rounded-xl border border-brand-primary/15 bg-white px-3 py-2.5 text-sm outline-none ring-brand-secondary focus:ring-2"
                          />
                        </label>
                        <label className="text-sm font-semibold text-foreground/90">
                          날짜
                          <input
                            type="date"
                            value={draft.date}
                            onChange={(inputEvent) =>
                              setEventDrafts((prev) => ({
                                ...prev,
                                [eventItem.id]: {
                                  ...draft,
                                  date: inputEvent.target.value,
                                },
                              }))
                            }
                            className="mt-1.5 w-full rounded-xl border border-brand-primary/15 bg-white px-3 py-2.5 text-sm outline-none ring-brand-secondary focus:ring-2"
                          />
                        </label>
                        <label className="text-sm font-semibold text-foreground/90">
                          시작 시간
                          <input
                            type="time"
                            value={draft.startTime}
                            onChange={(inputEvent) =>
                              setEventDrafts((prev) => ({
                                ...prev,
                                [eventItem.id]: {
                                  ...draft,
                                  startTime: inputEvent.target.value,
                                },
                              }))
                            }
                            className="mt-1.5 w-full rounded-xl border border-brand-primary/15 bg-white px-3 py-2.5 text-sm outline-none ring-brand-secondary focus:ring-2"
                          />
                        </label>
                        <label className="text-sm font-semibold text-foreground/90">
                          종료 시간
                          <input
                            type="time"
                            value={draft.endTime}
                            onChange={(inputEvent) =>
                              setEventDrafts((prev) => ({
                                ...prev,
                                [eventItem.id]: {
                                  ...draft,
                                  endTime: inputEvent.target.value,
                                },
                              }))
                            }
                            className="mt-1.5 w-full rounded-xl border border-brand-primary/15 bg-white px-3 py-2.5 text-sm outline-none ring-brand-secondary focus:ring-2"
                          />
                        </label>
                        <label className="text-sm font-semibold text-foreground/90">
                          프로그램명
                          <input
                            value={draft.programName}
                            onChange={(inputEvent) =>
                              setEventDrafts((prev) => ({
                                ...prev,
                                [eventItem.id]: {
                                  ...draft,
                                  programName: inputEvent.target.value,
                                },
                              }))
                            }
                            className="mt-1.5 w-full rounded-xl border border-brand-primary/15 bg-white px-3 py-2.5 text-sm outline-none ring-brand-secondary focus:ring-2"
                          />
                        </label>
                        <label className="text-sm font-semibold text-foreground/90">
                          기관명
                          <input
                            value={draft.organizationName}
                            onChange={(inputEvent) =>
                              setEventDrafts((prev) => ({
                                ...prev,
                                [eventItem.id]: {
                                  ...draft,
                                  organizationName: inputEvent.target.value,
                                },
                              }))
                            }
                            className="mt-1.5 w-full rounded-xl border border-brand-primary/15 bg-white px-3 py-2.5 text-sm outline-none ring-brand-secondary focus:ring-2"
                          />
                        </label>
                        <label className="text-sm font-semibold text-foreground/90">
                          장소
                          <input
                            value={draft.location}
                            onChange={(inputEvent) =>
                              setEventDrafts((prev) => ({
                                ...prev,
                                [eventItem.id]: {
                                  ...draft,
                                  location: inputEvent.target.value,
                                },
                              }))
                            }
                            className="mt-1.5 w-full rounded-xl border border-brand-primary/15 bg-white px-3 py-2.5 text-sm outline-none ring-brand-secondary focus:ring-2"
                          />
                        </label>
                        <label className="text-sm font-semibold text-foreground/90">
                          상태
                          <select
                            value={draft.status}
                            onChange={(inputEvent) =>
                              setEventDrafts((prev) => ({
                                ...prev,
                                [eventItem.id]: {
                                  ...draft,
                                  status: inputEvent.target.value,
                                },
                              }))
                            }
                            className="mt-1.5 w-full rounded-xl border border-brand-primary/15 bg-white px-3 py-2.5 text-sm outline-none ring-brand-secondary focus:ring-2"
                          >
                            {calendarStatusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <label className="mt-3 block text-sm font-semibold text-foreground/90">
                        메모
                        <textarea
                          value={draft.memo}
                          onChange={(inputEvent) =>
                            setEventDrafts((prev) => ({
                              ...prev,
                              [eventItem.id]: {
                                ...draft,
                                memo: inputEvent.target.value,
                              },
                            }))
                          }
                          className="mt-1.5 min-h-24 w-full rounded-xl border border-brand-primary/15 bg-white px-3 py-2.5 text-sm outline-none ring-brand-secondary focus:ring-2"
                        />
                      </label>

                      <label className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-foreground/90">
                        <input
                          type="checkbox"
                          checked={draft.isPublic}
                          onChange={(inputEvent) =>
                            setEventDrafts((prev) => ({
                              ...prev,
                              [eventItem.id]: {
                                ...draft,
                                isPublic: inputEvent.target.checked,
                              },
                            }))
                          }
                          className="h-4 w-4 rounded border-brand-primary/25"
                        />
                        공개 페이지에 노출
                      </label>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            void saveEvent(eventItem.id);
                          }}
                          disabled={isSaving}
                          className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:bg-brand-primary/50"
                        >
                          <Save className="h-4 w-4" aria-hidden />
                          {isSaving ? "저장 중..." : "일정 저장"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void deleteEvent(eventItem.id);
                          }}
                          disabled={isDeleting}
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-rose-300"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                          {isDeleting ? "삭제 중..." : "삭제"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </article>
        </section>
      ) : null}

      {activeTab === "gallery-guide" ? (
        <section className="mt-6 rounded-3xl border border-brand-primary/12 bg-white p-5 shadow-soft md:p-6">
          <h2 className="text-xl font-extrabold text-brand-primary">갤러리 관리 안내</h2>
          <p className="mt-1 text-sm text-foreground/80">
            현재는 로컬 이미지 + Notion fallback 구조로 동작합니다.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-brand-primary/10 bg-brand-cream/60 p-4">
              <h3 className="text-base font-bold text-brand-primary">현재 동작 방식</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-foreground/85">
                <li>1. Notion 갤러리 DB 조회 시도</li>
                <li>2. 실패 시 `public/gallery` 이미지 사용</li>
                <li>3. 해당 폴더가 비어 있으면 프로그램 이미지 fallback</li>
              </ul>
            </article>
            <article className="rounded-2xl border border-brand-primary/10 bg-brand-cream/60 p-4">
              <h3 className="text-base font-bold text-brand-primary">Notion 준비 체크</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-foreground/85">
                <li>- `NOTION_TOKEN`, `NOTION_PAGE_ID` 설정</li>
                <li>- 갤러리 DB 속성: 제목, slug, 카테고리, 설명, 이미지 경로, 공개 여부, 정렬 순서</li>
                <li>- 이미지 경로는 웹앱에서 접근 가능한 URL 또는 `/gallery/...` 사용</li>
              </ul>
            </article>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/gallery"
              className="inline-flex items-center rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary/90"
            >
              갤러리 페이지 열기
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-xl border border-brand-primary/20 px-4 py-2.5 text-sm font-semibold text-brand-primary hover:bg-brand-cream"
            >
              메인으로 이동
            </Link>
          </div>
        </section>
      ) : null}
    </section>
  );
}
