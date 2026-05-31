"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, MapPin } from "lucide-react";

interface PublicCalendarEvent {
  id: string;
  title: string;
  eventDate: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  description: string | null;
  status: string;
  isPublic: boolean;
  programSlug: string | null;
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

function formatTimeRange(startTime: string | null, endTime: string | null) {
  if (!startTime && !endTime) {
    return "시간 미정";
  }
  if (startTime && endTime) {
    return `${startTime} - ${endTime}`;
  }
  return startTime ?? endTime ?? "시간 미정";
}

export default function CalendarPage() {
  const [items, setItems] = useState<PublicCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadEvents = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch("/api/calendar?public=true", {
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          ok?: boolean;
          message?: string;
          items?: PublicCalendarEvent[];
        };

        if (!response.ok || !payload.ok) {
          if (!cancelled) {
            setErrorMessage(payload.message ?? "공개 일정을 불러오지 못했습니다.");
          }
          return;
        }

        if (!cancelled) {
          setItems(payload.items ?? []);
        }
      } catch {
        if (!cancelled) {
          setErrorMessage("공개 일정을 불러오는 중 오류가 발생했습니다.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  const groupedItems = useMemo(() => {
    return items.reduce<Record<string, PublicCalendarEvent[]>>((acc, item) => {
      const key = item.eventDate || item.date;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});
  }, [items]);

  const sortedDates = useMemo(
    () => Object.keys(groupedItems).sort((a, b) => a.localeCompare(b)),
    [groupedItems],
  );

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <header className="rounded-3xl border border-brand-primary/12 bg-white p-6 shadow-soft">
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-cream px-3 py-1 text-xs font-semibold text-brand-primary">
          <CalendarDays className="h-4 w-4" aria-hidden />
          Public Calendar
        </p>
        <h1 className="mt-3 font-heading text-3xl font-black text-brand-primary">
          공개 운영 일정
        </h1>
        <p className="mt-2 text-sm text-foreground/80">
          이 페이지에는 공개 설정(`is_public=true`)된 일정만 노출됩니다.
        </p>
      </header>

      {errorMessage ? (
        <p className="mt-6 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {errorMessage}
        </p>
      ) : null}

      {isLoading ? (
        <p className="mt-6 text-sm text-foreground/75">일정을 불러오는 중...</p>
      ) : sortedDates.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-brand-primary/20 bg-brand-cream p-4 text-sm text-foreground/80">
          공개된 일정이 아직 없습니다.
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {sortedDates.map((dateKey) => (
            <section key={dateKey}>
              <h2 className="text-lg font-extrabold text-brand-primary">{formatDateOnly(dateKey)}</h2>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                {groupedItems[dateKey].map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-brand-primary/10 bg-white p-4 shadow-sm"
                  >
                    <h3 className="text-base font-bold text-brand-primary">{item.title}</h3>
                    <p className="mt-1 text-sm text-foreground/80">
                      {item.programSlug || "프로그램 미정"}
                    </p>
                    <div className="mt-3 space-y-1.5 text-sm text-foreground/85">
                      <p className="inline-flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-brand-primary" aria-hidden />
                        {formatTimeRange(item.startTime, item.endTime)}
                      </p>
                      <p className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-brand-primary" aria-hidden />
                        {item.location || "장소 미정"}
                      </p>
                      <p>상태: {item.status || "예정"}</p>
                    </div>
                    {item.description ? (
                      <p className="mt-3 rounded-lg bg-brand-cream px-3 py-2 text-sm text-foreground/85">
                        {item.description}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
