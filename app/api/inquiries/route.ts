import { NextResponse } from "next/server";
import { isValidAdminPassword } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { InquiryLifecycleStatus } from "@/lib/types";

function getAdminPasswordFromHeaders(headers: Headers) {
  return headers.get("x-admin-password");
}

function mapInquiryRow(row: Record<string, unknown>) {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    phone: String(row.phone ?? ""),
    email: row.email ? String(row.email) : null,
    organizationName: String(row.organization_name ?? ""),
    programInterest: String(row.program_interest ?? ""),
    preferredDate: row.preferred_date ? String(row.preferred_date) : null,
    expectedStudents: row.expected_students ? String(row.expected_students) : null,
    message: String(row.message ?? ""),
    status: (row.status as InquiryLifecycleStatus) ?? "new",
    adminMemo: row.admin_memo ? String(row.admin_memo) : null,
    createdAt: row.created_at ? String(row.created_at) : "",
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      phone?: string;
      email?: string;
      organizationName?: string;
      programInterest?: string;
      preferredDate?: string;
      expectedStudents?: string;
      message?: string;
    };

    const name = body.name?.trim() ?? "";
    const phone = body.phone?.trim() ?? "";
    const organizationName = body.organizationName?.trim() ?? "";
    const programInterest = body.programInterest?.trim() ?? "";
    const message = body.message?.trim() ?? "";

    if (!name || !phone || !organizationName || !programInterest || !message) {
      return NextResponse.json(
        { ok: false, message: "필수 항목을 모두 입력해 주세요." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("inquiries").insert({
      name,
      phone,
      email: body.email?.trim() || null,
      organization_name: organizationName,
      program_interest: programInterest,
      preferred_date: body.preferredDate?.trim() || null,
      expected_students: body.expectedStudents?.trim() || null,
      message,
      status: "new",
    });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          message: "문의 저장 중 오류가 발생했습니다.",
          error: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "문의가 접수되었습니다. 담당자가 확인 후 연락드리겠습니다.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "요청 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const adminPassword = getAdminPasswordFromHeaders(request.headers);
  if (!isValidAdminPassword(adminPassword)) {
    return NextResponse.json(
      { ok: false, message: "관리자 인증이 필요합니다." },
      { status: 401 },
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { ok: false, message: "문의 목록을 가져오지 못했습니다.", error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      items: (data ?? []).map((row) => mapInquiryRow(row as Record<string, unknown>)),
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "문의 조회 중 오류가 발생했습니다." },
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
      status?: InquiryLifecycleStatus;
      adminMemo?: string;
    };

    const id = body.id?.trim();
    if (!id) {
      return NextResponse.json(
        { ok: false, message: "수정할 문의 ID가 필요합니다." },
        { status: 400 },
      );
    }

    const updates: Record<string, unknown> = {};
    if (body.status) {
      updates.status = body.status;
    }
    if (body.adminMemo !== undefined) {
      updates.admin_memo = body.adminMemo;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { ok: false, message: "수정할 항목이 없습니다." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("inquiries").update(updates).eq("id", id);

    if (error) {
      return NextResponse.json(
        { ok: false, message: "문의 수정 중 오류가 발생했습니다.", error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, message: "문의 정보가 업데이트되었습니다." });
  } catch {
    return NextResponse.json(
      { ok: false, message: "문의 수정 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
