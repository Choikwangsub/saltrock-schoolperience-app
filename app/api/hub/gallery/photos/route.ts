import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { assertAdminFromRequest } from "@/lib/api/adminGuard";
import { getAdminPhotos, isProgramSlug } from "@/lib/gallery/queries";
import { syncGalleryPhotoById } from "@/lib/notion/sync";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function revalidateGalleryPaths(programSlug: string, albumId: string) {
  revalidatePath("/gallery");
  revalidatePath(`/gallery/${programSlug}`);
  revalidatePath(`/gallery/${programSlug}/${albumId}`);
  revalidatePath("/hub/gallery");
  revalidatePath("/hub/notion");
}

export async function GET(request: Request) {
  const unauthorized = assertAdminFromRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  const url = new URL(request.url);
  const albumId = url.searchParams.get("albumId");
  if (!albumId) {
    return NextResponse.json(
      { ok: false, message: "albumId가 필요합니다.", items: [] },
      { status: 400 },
    );
  }

  const result = await getAdminPhotos(albumId);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, message: result.message, items: [] },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, items: result.items });
}

export async function POST(request: Request) {
  const unauthorized = assertAdminFromRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = (await request.json()) as {
      albumId?: string;
      programSlug?: string;
      imageUrl?: string;
      title?: string;
      description?: string;
      takenAt?: string;
      sortOrder?: number;
      isPublic?: boolean;
    };

    const albumId = body.albumId?.trim() ?? "";
    const programSlug = body.programSlug?.trim() ?? "";
    const imageUrl = body.imageUrl?.trim() ?? "";

    if (!albumId || !imageUrl || !programSlug || !isProgramSlug(programSlug)) {
      return NextResponse.json(
        { ok: false, message: "albumId, programSlug, imageUrl은 필수입니다." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("gallery_photos")
      .insert({
        album_id: albumId,
        program_slug: programSlug,
        image_url: imageUrl,
        title: body.title?.trim() || null,
        description: body.description?.trim() || null,
        taken_at: body.takenAt?.trim() || null,
        sort_order: Number.isFinite(body.sortOrder) ? body.sortOrder : 0,
        is_public: Boolean(body.isPublic),
        sync_status: "pending",
        sync_error: null,
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      return NextResponse.json(
        { ok: false, message: error?.message ?? "사진 등록에 실패했습니다." },
        { status: 500 },
      );
    }

    const syncResult = await syncGalleryPhotoById(String(data.id));
    revalidateGalleryPaths(programSlug, albumId);

    return NextResponse.json({
      ok: true,
      id: data.id,
      sync: syncResult,
      message: "사진이 등록되었습니다.",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "사진 등록 중 오류" },
      { status: 500 },
    );
  }
}
