import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { assertAdminFromRequest } from "@/lib/api/adminGuard";
import { syncCalendarEventById } from "@/lib/notion/sync";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function mapCalendarRow(row: Record<string, unknown>) {
  const eventDate = String(row.event_date ?? row.date ?? "");
  const startTime = typeof row.start_time === "string" ? row.start_time : null;
  const endTime = typeof row.end_time === "string" ? row.end_time : null;
  const programSlug =
    typeof row.program_slug === "string"
      ? row.program_slug
      : typeof row.program_name === "string"
        ? row.program_name
        : null;

  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    programSlug,
    eventDate,
    date: eventDate,
    startTime,
    endTime,
    location: typeof row.location === "string" ? row.location : null,
    description:
      typeof row.description === "string"
        ? row.description
        : typeof row.memo === "string"
          ? row.memo
          : null,
    status: typeof row.status === "string" ? row.status : "scheduled",
    isPublic: Boolean(row.is_public),
    notionPageId: typeof row.notion_page_id === "string" ? row.notion_page_id : null,
    syncStatus: typeof row.sync_status === "string" ? row.sync_status : "pending",
    syncError: typeof row.sync_error === "string" ? row.sync_error : null,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

function revalidateCalendarPaths() {
  revalidatePath("/calendar");
  revalidatePath("/hub/calendar");
  revalidatePath("/hub/notion");
  revalidatePath("/hub");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const publicOnly = url.searchParams.get("public") === "true";

  if (!publicOnly) {
    const unauthorized = assertAdminFromRequest(request);
    if (unauthorized) {
      return unauthorized;
    }
  }

  try {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("calendar_events")
      .select("*")
      .order("event_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (publicOnly) {
      query = query.eq("is_public", true);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ ok: false, message: error.message, items: [] }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      items: (data ?? []).map((row) => mapCalendarRow(row as Record<string, unknown>)),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "일정 조회 중 오류", items: [] },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const unauthorized = assertAdminFromRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = (await request.json()) as {
      title?: string;
      eventDate?: string;
      date?: string;
      startTime?: string;
      endTime?: string;
      programSlug?: string;
      programName?: string;
      location?: string;
      description?: string;
      memo?: string;
      isPublic?: boolean;
      status?: string;
    };

    const title = body.title?.trim() ?? "";
    const eventDate = body.eventDate?.trim() || body.date?.trim() || "";
    if (!title || !eventDate) {
      return NextResponse.json(
        { ok: false, message: "title과 eventDate(date)는 필수입니다." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("calendar_events")
      .insert({
        title,
        program_slug: body.programSlug?.trim() || body.programName?.trim() || null,
        event_date: eventDate,
        start_time: body.startTime?.trim() || null,
        end_time: body.endTime?.trim() || null,
        location: body.location?.trim() || null,
        description: body.description?.trim() || body.memo?.trim() || null,
        status: body.status?.trim() || "scheduled",
        is_public: Boolean(body.isPublic),
        sync_status: "pending",
        sync_error: null,
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      return NextResponse.json(
        { ok: false, message: error?.message ?? "일정 등록 실패" },
        { status: 500 },
      );
    }

    const syncResult = await syncCalendarEventById(String(data.id));
    revalidateCalendarPaths();

    return NextResponse.json({
      ok: true,
      id: data.id,
      sync: syncResult,
      message: "일정이 등록되었습니다.",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "일정 등록 중 오류" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const unauthorized = assertAdminFromRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = (await request.json()) as {
      id?: string;
      title?: string;
      eventDate?: string;
      date?: string;
      startTime?: string;
      endTime?: string;
      programSlug?: string;
      programName?: string;
      location?: string;
      description?: string;
      memo?: string;
      isPublic?: boolean;
      status?: string;
    };

    const id = body.id?.trim();
    if (!id) {
      return NextResponse.json({ ok: false, message: "일정 ID가 필요합니다." }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      sync_status: "pending",
      sync_error: null,
    };

    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.eventDate !== undefined || body.date !== undefined) {
      updates.event_date = body.eventDate?.trim() || body.date?.trim() || null;
    }
    if (body.startTime !== undefined) updates.start_time = body.startTime.trim() || null;
    if (body.endTime !== undefined) updates.end_time = body.endTime.trim() || null;
    if (body.programSlug !== undefined || body.programName !== undefined) {
      updates.program_slug = body.programSlug?.trim() || body.programName?.trim() || null;
    }
    if (body.location !== undefined) updates.location = body.location.trim() || null;
    if (body.description !== undefined || body.memo !== undefined) {
      updates.description = body.description?.trim() || body.memo?.trim() || null;
    }
    if (body.isPublic !== undefined) updates.is_public = Boolean(body.isPublic);
    if (body.status !== undefined) updates.status = body.status.trim() || "scheduled";

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("calendar_events").update(updates).eq("id", id);
    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }

    const syncResult = await syncCalendarEventById(id);
    revalidateCalendarPaths();

    return NextResponse.json({
      ok: true,
      sync: syncResult,
      message: "일정이 수정되었습니다.",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "일정 수정 중 오류" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const unauthorized = assertAdminFromRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = (await request.json()) as { id?: string };
    const id = body.id?.trim();
    if (!id) {
      return NextResponse.json({ ok: false, message: "일정 ID가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("calendar_events").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }

    revalidateCalendarPaths();
    return NextResponse.json({ ok: true, message: "일정이 삭제되었습니다." });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "일정 삭제 중 오류" },
      { status: 500 },
    );
  }
}
