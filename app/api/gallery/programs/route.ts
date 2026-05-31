import { NextResponse } from "next/server";
import { getPublicGalleryProgramFolders } from "@/lib/gallery/queries";

export async function GET() {
  try {
    const items = await getPublicGalleryProgramFolders();
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "프로그램 폴더 조회 중 오류가 발생했습니다.",
        items: [],
      },
      { status: 500 },
    );
  }
}
