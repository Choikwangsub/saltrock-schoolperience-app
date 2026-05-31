import { NextResponse } from "next/server";
import { isValidAdminPassword } from "@/lib/adminAuth";

export function getAdminPasswordFromHeaders(headers: Headers) {
  return headers.get("x-admin-password");
}

export function assertAdminFromRequest(request: Request) {
  const adminPassword = getAdminPasswordFromHeaders(request.headers);
  if (!isValidAdminPassword(adminPassword)) {
    return NextResponse.json(
      { ok: false, message: "관리자 인증이 필요합니다." },
      { status: 401 },
    );
  }
  return null;
}
