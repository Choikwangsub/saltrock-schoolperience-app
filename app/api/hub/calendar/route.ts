import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { assertAdminFromRequest } from "@/lib/api/adminGuard";
import { syncCalendarEventById } from "@/lib/notion/sync";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function revalidateCalendarPaths() {
  revalidatePath("/calendar");
  revalidatePath("/hub/calendar");
  revalidatePath("/hub");
  revalidatePath("/hub/notion");
}

export async function GET(request: Request) {
  const unauthorized = assertAdminFromRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .order("event_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ ok: false, message: error.message, items: [] }, { status: 500 });
    }

    return NextResponse.json({ ok: true, items: data ?? [] });
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
      programSlug?: string;
      eventDate?: string;
      startTime?: string;
      endTime?: string;
      location?: string;
      description?: string;
      isPublic?: boolean;
      status?: string;
    };

    const title = body.title?.trim() ?? "";
    const eventDate = body.eventDate?.trim() ?? "";

    if (!title || !eventDate) {
      return NextResponse.json(
        { ok: false, message: "title과 eventDate는 필수입니다." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("calendar_events")
      .insert({
        title,
        program_slug: body.programSlug?.trim() || null,
        event_date: eventDate,
        start_time: body.startTime?.trim() || null,
        end_time: body.endTime?.trim() || null,
        location: body.location?.trim() || null,
        description: body.description?.trim() || null,
        is_public: Boolean(body.isPublic),
        status: body.status?.trim() || "scheduled",
        sync_status: "pending",
        sync_error: null,
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      return NextResponse.json(
        { ok: false, message: error?.message ?? "일정 생성에 실패했습니다." },
        { status: 500 },
      );
    }

    const syncResult = await syncCalendarEventById(String(data.id));
    revalidateCalendarPaths();

    return NextResponse.json({
      ok: true,
      id: data.id,
      sync: syncResult,
      message: "일정이 생성되었습니다.",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "일정 생성 중 오류" },
      { status: 500 },
    );
  }
}
