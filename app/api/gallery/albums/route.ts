import { NextResponse } from "next/server";
import { getPublicAlbumsByProgramSlug, isProgramSlug } from "@/lib/gallery/queries";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const programSlug = url.searchParams.get("programSlug");

  if (!programSlug || !isProgramSlug(programSlug)) {
    return NextResponse.json(
      { ok: false, message: "유효한 programSlug가 필요합니다.", items: [] },
      { status: 400 },
    );
  }

  try {
    const result = await getPublicAlbumsByProgramSlug(programSlug);
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
        message: error instanceof Error ? error.message : "앨범 조회 중 오류가 발생했습니다.",
        items: [],
      },
      { status: 500 },
    );
  }
}
