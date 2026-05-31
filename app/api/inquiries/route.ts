import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { assertAdminFromRequest } from "@/lib/api/adminGuard";
import { sendInquiryAdminNotificationEmail } from "@/lib/notifications/adminEmail";
import { syncInquiryById } from "@/lib/notion/sync";
import { getPrograms } from "@/lib/programs";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { InquiryLifecycleStatus } from "@/lib/types";

const statusValues: InquiryLifecycleStatus[] = [
  "new",
  "contacted",
  "confirmed",
  "completed",
  "cancelled",
];

function normalizeProgramSlug(value: string) {
  const programs = getPrograms();
  const matchedBySlug = programs.find((program) => program.slug === value);
  if (matchedBySlug) {
    return matchedBySlug.slug;
  }

  const matchedByTitle = programs.find((program) => program.title === value);
  if (matchedByTitle) {
    return matchedByTitle.slug;
  }

  return value
    .toLowerCase()
    .replace(/[^a-z0-9\- ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function mapInquiryRow(row: Record<string, unknown>) {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    phone: String(row.phone ?? ""),
    email: typeof row.email === "string" ? row.email : null,
    programSlug: typeof row.program_slug === "string" ? row.program_slug : null,
    programInterest:
      typeof row.program_interest === "string"
        ? row.program_interest
        : typeof row.program_slug === "string"
          ? row.program_slug
          : "",
    organizationName: typeof row.organization_name === "string" ? row.organization_name : "",
    preferredDate: typeof row.preferred_date === "string" ? row.preferred_date : null,
    expectedStudents: typeof row.expected_students === "string" ? row.expected_students : null,
    message: String(row.message ?? ""),
    status: statusValues.includes(row.status as InquiryLifecycleStatus)
      ? (row.status as InquiryLifecycleStatus)
      : "new",
    adminMemo: typeof row.admin_memo === "string" ? row.admin_memo : null,
    syncStatus: typeof row.sync_status === "string" ? row.sync_status : "pending",
    syncError: typeof row.sync_error === "string" ? row.sync_error : null,
    createdAt: typeof row.created_at === "string" ? row.created_at : "",
  };
}

function revalidateInquiryPaths() {
  revalidatePath("/contact");
  revalidatePath("/hub");
  revalidatePath("/hub/notion");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      phone?: string;
      email?: string;
      organizationName?: string;
      programInterest?: string;
      programSlug?: string;
      preferredDate?: string;
      expectedStudents?: string;
      message?: string;
    };

    const name = body.name?.trim() ?? "";
    const phone = body.phone?.trim() ?? "";
    const organizationName = body.organizationName?.trim() ?? "";
    const message = body.message?.trim() ?? "";
    const rawProgramValue = body.programSlug?.trim() || body.programInterest?.trim() || "";
    const programSlug = rawProgramValue ? normalizeProgramSlug(rawProgramValue) : "";

    if (!name || !phone || !message || !rawProgramValue) {
      return NextResponse.json(
        { ok: false, message: "필수 항목(이름, 연락처, 프로그램, 문의 내용)을 입력해 주세요." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("inquiries")
      .insert({
        name,
        phone,
        email: body.email?.trim() || null,
        program_slug: programSlug || null,
        message,
        status: "new",
        notion_page_id: null,
        sync_status: "pending",
        sync_error: null,
        synced_at: null,
        organization_name: organizationName || null,
        program_interest: body.programInterest?.trim() || rawProgramValue,
        preferred_date: body.preferredDate?.trim() || null,
        expected_students: body.expectedStudents?.trim() || null,
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      return NextResponse.json(
        {
          ok: false,
          message: error?.message ?? "문의 저장 중 오류가 발생했습니다.",
        },
        { status: 500 },
      );
    }

    const inquiryId = String(data.id);
    const syncResult = await syncInquiryById(inquiryId);
    const notifyResult = await sendInquiryAdminNotificationEmail({
      id: inquiryId,
      name,
      phone,
      email: body.email?.trim() || null,
      organizationName,
      programValue: body.programInterest?.trim() || rawProgramValue,
      preferredDate: body.preferredDate?.trim() || null,
      expectedStudents: body.expectedStudents?.trim() || null,
      message,
    });

    if (!notifyResult.ok) {
      console.error(`[inquiries] ${notifyResult.message}`);
    }

    revalidateInquiryPaths();

    return NextResponse.json({
      ok: true,
      id: inquiryId,
      sync: syncResult,
      notify: notifyResult,
      message: "문의가 접수되었습니다. 담당자가 확인 후 연락드리겠습니다.",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "문의 처리 중 오류" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const unauthorized = assertAdminFromRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { ok: false, message: error.message || "문의 조회 실패", items: [] },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      items: (data ?? []).map((row) => mapInquiryRow(row as Record<string, unknown>)),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "문의 조회 중 오류", items: [] },
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
      status?: InquiryLifecycleStatus;
      adminMemo?: string;
    };

    const id = body.id?.trim();
    if (!id) {
      return NextResponse.json({ ok: false, message: "문의 ID가 필요합니다." }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      sync_status: "pending",
      sync_error: null,
      synced_at: null,
    };

    if (body.status) {
      if (!statusValues.includes(body.status)) {
        return NextResponse.json(
          { ok: false, message: "유효하지 않은 문의 상태입니다." },
          { status: 400 },
        );
      }
      updates.status = body.status;
    }

    if (body.adminMemo !== undefined) {
      updates.admin_memo = body.adminMemo.trim() || null;
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("inquiries").update(updates).eq("id", id);
    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }

    const syncResult = await syncInquiryById(id);
    revalidateInquiryPaths();

    return NextResponse.json({
      ok: true,
      sync: syncResult,
      message: "문의 정보가 수정되었습니다.",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "문의 수정 중 오류" },
      { status: 500 },
    );
  }
}
