import { NextResponse } from "next/server";
import { isValidAdminPassword } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function getAdminPasswordFromHeaders(headers: Headers) {
  return headers.get("x-admin-password");
}

function mapCalendarRow(row: Record<string, unknown>) {
  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    date: String(row.date ?? ""),
    startTime: row.start_time ? String(row.start_time) : null,
    endTime: row.end_time ? String(row.end_time) : null,
    programName: row.program_name ? String(row.program_name) : null,
    organizationName: row.organization_name ? String(row.organization_name) : null,
    location: row.location ? String(row.location) : null,
    status: row.status ? String(row.status) : "scheduled",
    memo: row.memo ? String(row.memo) : null,
    isPublic: Boolean(row.is_public),
    createdAt: row.created_at ? String(row.created_at) : "",
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const publicOnly = url.searchParams.get("public") === "true";
  const adminPassword = getAdminPasswordFromHeaders(request.headers);

  if (!publicOnly && !isValidAdminPassword(adminPassword)) {
    return NextResponse.json(
      { ok: false, message: "관리자 인증이 필요합니다." },
      { status: 401 },
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    let query = supabase.from("calendar_events").select("*").order("date", { ascending: true });

    if (publicOnly) {
      query = query.eq("is_public", true);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { ok: false, message: "일정 조회 중 오류가 발생했습니다.", error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      items: (data ?? []).map((row) => mapCalendarRow(row as Record<string, unknown>)),
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "일정 조회 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const adminPassword = getAdminPasswordFromHeaders(request.headers);
  if (!isValidAdminPassword(adminPassword)) {
    return NextResponse.json(
      { ok: false, message: "관리자 인증이 필요합니다." },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json()) as {
      title?: string;
      date?: string;
      startTime?: string;
      endTime?: string;
      programName?: string;
      organizationName?: string;
      location?: string;
      status?: string;
      memo?: string;
      isPublic?: boolean;
    };

    const title = body.title?.trim() ?? "";
    const date = body.date?.trim() ?? "";
    if (!title || !date) {
      return NextResponse.json(
        { ok: false, message: "제목과 날짜는 필수입니다." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("calendar_events").insert({
      title,
      date,
      start_time: body.startTime?.trim() || null,
      end_time: body.endTime?.trim() || null,
      program_name: body.programName?.trim() || null,
      organization_name: body.organizationName?.trim() || null,
      location: body.location?.trim() || null,
      status: body.status?.trim() || "scheduled",
      memo: body.memo?.trim() || null,
      is_public: Boolean(body.isPublic),
    });

    if (error) {
      return NextResponse.json(
        { ok: false, message: "일정 저장 중 오류가 발생했습니다.", error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, message: "일정이 추가되었습니다." });
  } catch {
    return NextResponse.json(
      { ok: false, message: "일정 저장 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const adminPassword = getAdminPasswordFromHeaders(request.headers);
  if (!isValidAdminPassword(adminPassword)) {
    return NextResponse.json(
      { ok: false, message: "관리자 인증이 필요합니다." },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json()) as {
      id?: string;
      title?: string;
      date?: string;
      startTime?: string;
      endTime?: string;
      programName?: string;
      organizationName?: string;
      location?: string;
      status?: string;
      memo?: string;
      isPublic?: boolean;
    };

    const id = body.id?.trim();
    if (!id) {
      return NextResponse.json(
        { ok: false, message: "수정할 일정 ID가 필요합니다." },
        { status: 400 },
      );
    }

    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.date !== undefined) updates.date = body.date.trim();
    if (body.startTime !== undefined) updates.start_time = body.startTime.trim() || null;
    if (body.endTime !== undefined) updates.end_time = body.endTime.trim() || null;
    if (body.programName !== undefined) updates.program_name = body.programName.trim() || null;
    if (body.organizationName !== undefined) {
      updates.organization_name = body.organizationName.trim() || null;
    }
    if (body.location !== undefined) updates.location = body.location.trim() || null;
    if (body.status !== undefined) updates.status = body.status.trim() || "scheduled";
    if (body.memo !== undefined) updates.memo = body.memo.trim() || null;
    if (body.isPublic !== undefined) updates.is_public = Boolean(body.isPublic);

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("calendar_events").update(updates).eq("id", id);

    if (error) {
      return NextResponse.json(
        { ok: false, message: "일정 수정 중 오류가 발생했습니다.", error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, message: "일정이 업데이트되었습니다." });
  } catch {
    return NextResponse.json(
      { ok: false, message: "일정 수정 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const adminPassword = getAdminPasswordFromHeaders(request.headers);
  if (!isValidAdminPassword(adminPassword)) {
    return NextResponse.json(
      { ok: false, message: "관리자 인증이 필요합니다." },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json()) as { id?: string };
    const id = body.id?.trim();
    if (!id) {
      return NextResponse.json(
        { ok: false, message: "삭제할 일정 ID가 필요합니다." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("calendar_events").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { ok: false, message: "일정 삭제 중 오류가 발생했습니다.", error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, message: "일정이 삭제되었습니다." });
  } catch {
    return NextResponse.json(
      { ok: false, message: "일정 삭제 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
