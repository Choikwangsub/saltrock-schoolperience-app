"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, RefreshCw, Save, Trash2 } from "lucide-react";
import { AdminGate } from "@/components/hub/AdminGate";

interface CalendarEventRecord {
  id: string;
  title: string;
  program_slug: string | null;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  description: string | null;
  status: string;
  is_public: boolean;
  sync_status: string | null;
  sync_error: string | null;
}

interface EventFormState {
  title: string;
  programSlug: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  status: string;
  isPublic: boolean;
}

const initialForm: EventFormState = {
  title: "",
  programSlug: "",
  eventDate: "",
  startTime: "",
  endTime: "",
  location: "",
  description: "",
  status: "scheduled",
  isPublic: false,
};

const statusOptions = [
  { value: "scheduled", label: "예정" },
  { value: "pending", label: "조율중" },
  { value: "confirmed", label: "확정" },
  { value: "completed", label: "완료" },
  { value: "cancelled", label: "취소" },
];

function HubCalendarContent({ adminPassword }: { adminPassword: string }) {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEventRecord[]>([]);
  const [drafts, setDrafts] = useState<Record<string, EventFormState>>({});
  const [form, setForm] = useState<EventFormState>(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
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

  const loadEvents = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await authorizedFetch("/api/hub/calendar");
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        items?: CalendarEventRecord[];
      };
      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.message ?? "일정 목록을 불러오지 못했습니다.");
        return;
      }

      const loadedItems = payload.items ?? [];
      setEvents(loadedItems);
      setDrafts(
        Object.fromEntries(
          loadedItems.map((item) => [
            item.id,
            {
              title: item.title,
              programSlug: item.program_slug ?? "",
              eventDate: item.event_date ?? "",
              startTime: item.start_time ?? "",
              endTime: item.end_time ?? "",
              location: item.location ?? "",
              description: item.description ?? "",
              status: item.status ?? "scheduled",
              isPublic: item.is_public,
            },
          ]),
        ),
      );
    } catch {
      setErrorMessage("일정 목록 조회 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminPassword]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    if (!form.title.trim() || !form.eventDate.trim()) {
      setErrorMessage("제목과 날짜는 필수입니다.");
      return;
    }

    setIsCreating(true);
    try {
      const response = await authorizedFetch("/api/hub/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.message ?? "일정 생성에 실패했습니다.");
        return;
      }

      setMessage(payload.message ?? "일정이 생성되었습니다.");
      setForm(initialForm);
      await loadEvents();
      router.refresh();
    } catch {
      setErrorMessage("일정 생성 중 오류가 발생했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  const saveEvent = async (id: string) => {
    const draft = drafts[id];
    if (!draft) return;

    setMessage("");
    setErrorMessage("");

    try {
      const response = await authorizedFetch(`/api/hub/calendar/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.message ?? "일정 수정에 실패했습니다.");
        return;
      }
      setMessage(payload.message ?? "일정이 수정되었습니다.");
      await loadEvents();
      router.refresh();
    } catch {
      setErrorMessage("일정 수정 중 오류가 발생했습니다.");
    }
  };

  const deleteEvent = async (id: string) => {
    const confirmed = window.confirm("이 일정을 삭제하시겠습니까?");
    if (!confirmed) return;

    setMessage("");
    setErrorMessage("");

    try {
      const response = await authorizedFetch(`/api/hub/calendar/${id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.message ?? "일정 삭제에 실패했습니다.");
        return;
      }
      setMessage(payload.message ?? "일정이 삭제되었습니다.");
      await loadEvents();
      router.refresh();
    } catch {
      setErrorMessage("일정 삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="rounded-3xl border border-brand-primary/12 bg-white p-5 shadow-soft md:p-6">
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-cream px-3 py-1 text-xs font-semibold text-brand-primary">
          <CalendarDays className="h-4 w-4" aria-hidden />
          Calendar Admin
        </p>
        <h1 className="mt-2 font-heading text-3xl font-black text-brand-primary">일정 관리</h1>
        <p className="mt-2 text-sm text-foreground/80">
          생성/수정/삭제와 공개 여부를 관리하면 `/calendar` 페이지에 반영됩니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/hub/notion"
            className="rounded-lg border border-brand-primary/20 bg-white px-3 py-1.5 text-sm font-semibold text-brand-primary hover:bg-brand-cream"
          >
            Notion 동기화 관리
          </Link>
          <button
            type="button"
            onClick={() => void loadEvents()}
            className="inline-flex items-center gap-1 rounded-lg border border-brand-primary/20 bg-white px-3 py-1.5 text-sm font-semibold text-brand-primary hover:bg-brand-cream"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            새로고침
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
        <article className="rounded-3xl border border-brand-primary/12 bg-white p-5 shadow-soft lg:col-span-4">
          <h2 className="text-lg font-extrabold text-brand-primary">새 일정 만들기</h2>
          <form onSubmit={handleCreate} className="mt-4 space-y-3">
            <label className="block text-sm font-semibold text-foreground/90">
              제목 *
              <input
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-brand-primary/15 px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block text-sm font-semibold text-foreground/90">
              프로그램 slug
              <input
                value={form.programSlug}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, programSlug: event.target.value }))
                }
                className="mt-1.5 w-full rounded-xl border border-brand-primary/15 px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block text-sm font-semibold text-foreground/90">
              행사 날짜 *
              <input
                type="date"
                value={form.eventDate}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, eventDate: event.target.value }))
                }
                className="mt-1.5 w-full rounded-xl border border-brand-primary/15 px-3 py-2.5 text-sm"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-semibold text-foreground/90">
                시작
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, startTime: event.target.value }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-brand-primary/15 px-3 py-2.5 text-sm"
                />
              </label>
              <label className="text-sm font-semibold text-foreground/90">
                종료
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, endTime: event.target.value }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-brand-primary/15 px-3 py-2.5 text-sm"
                />
              </label>
            </div>
            <label className="block text-sm font-semibold text-foreground/90">
              장소
              <input
                value={form.location}
                onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-brand-primary/15 px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block text-sm font-semibold text-foreground/90">
              설명
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, description: event.target.value }))
                }
                className="mt-1.5 min-h-20 w-full rounded-xl border border-brand-primary/15 px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block text-sm font-semibold text-foreground/90">
              상태
              <select
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-brand-primary/15 px-3 py-2.5 text-sm"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/90">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, isPublic: event.target.checked }))
                }
              />
              공개 일정으로 노출
            </label>
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:bg-brand-primary/50"
            >
              <Save className="h-4 w-4" aria-hidden />
              {isCreating ? "저장 중..." : "일정 저장"}
            </button>
          </form>
        </article>

        <article className="rounded-3xl border border-brand-primary/12 bg-white p-5 shadow-soft lg:col-span-8">
          <h2 className="text-lg font-extrabold text-brand-primary">일정 목록</h2>
          {isLoading ? (
            <p className="mt-4 text-sm text-foreground/75">일정 목록을 불러오는 중...</p>
          ) : events.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-brand-primary/20 bg-brand-cream p-4 text-sm text-foreground/80">
              등록된 일정이 없습니다.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {events.map((event) => {
                const draft = drafts[event.id];
                if (!draft) return null;
                return (
                  <article key={event.id} className="rounded-2xl border border-brand-primary/10 p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <label className="text-xs font-semibold text-foreground/80">
                        제목
                        <input
                          value={draft.title}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [event.id]: { ...draft, title: e.target.value },
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-brand-primary/15 px-2.5 py-2 text-sm"
                        />
                      </label>
                      <label className="text-xs font-semibold text-foreground/80">
                        프로그램 slug
                        <input
                          value={draft.programSlug}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [event.id]: { ...draft, programSlug: e.target.value },
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-brand-primary/15 px-2.5 py-2 text-sm"
                        />
                      </label>
                      <label className="text-xs font-semibold text-foreground/80">
                        행사 날짜
                        <input
                          type="date"
                          value={draft.eventDate}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [event.id]: { ...draft, eventDate: e.target.value },
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-brand-primary/15 px-2.5 py-2 text-sm"
                        />
                      </label>
                      <label className="text-xs font-semibold text-foreground/80">
                        상태
                        <select
                          value={draft.status}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [event.id]: { ...draft, status: e.target.value },
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
                      <label className="text-xs font-semibold text-foreground/80">
                        시작
                        <input
                          type="time"
                          value={draft.startTime}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [event.id]: { ...draft, startTime: e.target.value },
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-brand-primary/15 px-2.5 py-2 text-sm"
                        />
                      </label>
                      <label className="text-xs font-semibold text-foreground/80">
                        종료
                        <input
                          type="time"
                          value={draft.endTime}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [event.id]: { ...draft, endTime: e.target.value },
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-brand-primary/15 px-2.5 py-2 text-sm"
                        />
                      </label>
                    </div>
                    <label className="mt-2 block text-xs font-semibold text-foreground/80">
                      장소
                      <input
                        value={draft.location}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [event.id]: { ...draft, location: e.target.value },
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-brand-primary/15 px-2.5 py-2 text-sm"
                      />
                    </label>
                    <label className="mt-2 block text-xs font-semibold text-foreground/80">
                      설명
                      <textarea
                        value={draft.description}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [event.id]: { ...draft, description: e.target.value },
                          }))
                        }
                        className="mt-1 min-h-20 w-full rounded-lg border border-brand-primary/15 px-2.5 py-2 text-sm"
                      />
                    </label>
                    <label className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-foreground/80">
                      <input
                        type="checkbox"
                        checked={draft.isPublic}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [event.id]: { ...draft, isPublic: e.target.checked },
                          }))
                        }
                      />
                      공개 일정
                    </label>
                    <p className="mt-2 text-xs text-foreground/70">
                      Sync: {event.sync_status || "-"}{" "}
                      {event.sync_error ? `| Error: ${event.sync_error}` : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void saveEvent(event.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-brand-primary/20 px-3 py-1.5 text-xs font-semibold text-brand-primary hover:bg-brand-cream"
                      >
                        <Save className="h-3.5 w-3.5" aria-hidden />
                        저장
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteEvent(event.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        삭제
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}

export default function HubCalendarPage() {
  return (
    <AdminGate
      title="일정 관리"
      description="캘린더 일정 생성/수정/삭제와 공개 여부를 관리할 수 있습니다."
    >
      {({ adminPassword }) => <HubCalendarContent adminPassword={adminPassword} />}
    </AdminGate>
  );
}
