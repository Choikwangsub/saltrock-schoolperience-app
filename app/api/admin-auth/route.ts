import { NextResponse } from "next/server";
import { isValidAdminPassword } from "@/lib/adminAuth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: string };
    const password = body.password?.trim();
    if (!password) {
      return NextResponse.json(
        { ok: false, message: "비밀번호를 입력해 주세요." },
        { status: 400 },
      );
    }

    if (!isValidAdminPassword(password)) {
      return NextResponse.json(
        { ok: false, message: "관리자 비밀번호가 올바르지 않습니다." },
        { status: 401 },
      );
    }

    return NextResponse.json({ ok: true, message: "인증되었습니다." });
  } catch {
    return NextResponse.json(
      { ok: false, message: "인증 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
