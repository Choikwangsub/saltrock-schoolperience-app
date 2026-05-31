import { NextResponse } from "next/server";
import { assertAdminFromRequest } from "@/lib/api/adminGuard";
import { createStoragePath, isProgramSlug } from "@/lib/gallery/queries";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const unauthorized = assertAdminFromRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const programSlug = String(formData.get("programSlug") ?? "").trim();
    const albumId = String(formData.get("albumId") ?? "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, message: "업로드할 파일이 필요합니다." }, { status: 400 });
    }

    if (!isProgramSlug(programSlug)) {
      return NextResponse.json(
        { ok: false, message: "유효한 programSlug가 필요합니다." },
        { status: 400 },
      );
    }

    if (!albumId) {
      return NextResponse.json({ ok: false, message: "albumId가 필요합니다." }, { status: 400 });
    }

    const timestampedName = `${Date.now()}-${file.name}`;
    const storagePath = createStoragePath(programSlug, albumId, timestampedName);

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage.from("gallery").upload(storagePath, fileBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

    if (error) {
      return NextResponse.json(
        { ok: false, message: `Storage 업로드 실패: ${error.message}` },
        { status: 500 },
      );
    }

    const { data } = supabase.storage.from("gallery").getPublicUrl(storagePath);

    return NextResponse.json({
      ok: true,
      storagePath,
      publicUrl: data.publicUrl,
      message: "업로드가 완료되었습니다.",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "업로드 중 오류" },
      { status: 500 },
    );
  }
}
