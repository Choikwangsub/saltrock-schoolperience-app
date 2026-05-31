import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { assertAdminFromRequest } from "@/lib/api/adminGuard";
import { syncCalendarEventById } from "@/lib/notion/sync";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function revalidateCalendarPaths() {
  revalidatePath("/calendar");
  revalidatePath("/hub/calendar");
  revalidatePath("/hub");
  revalidatePath("/hub/notion");
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const unauthorized = assertAdminFromRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await params;

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

    const updates: Record<string, unknown> = {
      sync_status: "pending",
      sync_error: null,
    };

    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.programSlug !== undefined) updates.program_slug = body.programSlug.trim() || null;
    if (body.eventDate !== undefined) updates.event_date = body.eventDate.trim() || null;
    if (body.startTime !== undefined) updates.start_time = body.startTime.trim() || null;
    if (body.endTime !== undefined) updates.end_time = body.endTime.trim() || null;
    if (body.location !== undefined) updates.location = body.location.trim() || null;
    if (body.description !== undefined) updates.description = body.description.trim() || null;
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

export async function DELETE(request: Request, { params }: RouteParams) {
  const unauthorized = assertAdminFromRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  revalidateCalendarPaths();
  return NextResponse.json({ ok: true, message: "일정이 삭제되었습니다." });
}
