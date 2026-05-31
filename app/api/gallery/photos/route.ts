import { NextResponse } from "next/server";
import { getPublicPhotosByAlbum, isProgramSlug } from "@/lib/gallery/queries";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const albumId = url.searchParams.get("albumId");
  const programSlug = url.searchParams.get("programSlug");

  if (!albumId || !programSlug || !isProgramSlug(programSlug)) {
    return NextResponse.json(
      { ok: false, message: "albumId와 유효한 programSlug가 필요합니다.", items: [] },
      { status: 400 },
    );
  }

  try {
    const result = await getPublicPhotosByAlbum(programSlug, albumId);
    return NextResponse.json({
      ok: true,
      items: result.items,
      usedFallback: result.usedFallback,
      errorMessage: result.errorMessage,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "사진 조회 중 오류가 발생했습니다.",
        items: [],
      },
      { status: 500 },
    );
  }
}
