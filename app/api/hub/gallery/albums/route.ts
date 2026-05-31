import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { assertAdminFromRequest } from "@/lib/api/adminGuard";
import { getAdminAlbums, isProgramSlug } from "@/lib/gallery/queries";
import { syncGalleryAlbumById } from "@/lib/notion/sync";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function revalidateGalleryPaths(programSlug: string, albumId?: string) {
  revalidatePath("/gallery");
  revalidatePath(`/gallery/${programSlug}`);
  if (albumId) {
    revalidatePath(`/gallery/${programSlug}/${albumId}`);
  }
  revalidatePath("/hub/gallery");
  revalidatePath("/hub/notion");
}

export async function GET(request: Request) {
  const unauthorized = assertAdminFromRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  const url = new URL(request.url);
  const programSlug = url.searchParams.get("programSlug");

  if (programSlug && !isProgramSlug(programSlug)) {
    return NextResponse.json(
      { ok: false, message: "유효한 programSlug가 필요합니다.", items: [] },
      { status: 400 },
    );
  }

  const selectedProgramSlug = programSlug && isProgramSlug(programSlug) ? programSlug : undefined;
  const result = await getAdminAlbums(selectedProgramSlug);
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
      title?: string;
      programSlug?: string;
      eventDate?: string;
      location?: string;
      description?: string;
      coverImageUrl?: string;
      isPublic?: boolean;
    };

    const title = body.title?.trim() ?? "";
    const programSlug = body.programSlug?.trim() ?? "";

    if (!title || !programSlug || !isProgramSlug(programSlug)) {
      return NextResponse.json(
        { ok: false, message: "title과 유효한 programSlug는 필수입니다." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("gallery_albums")
      .insert({
        title,
        program_slug: programSlug,
        event_date: body.eventDate?.trim() || null,
        location: body.location?.trim() || null,
        description: body.description?.trim() || null,
        cover_image_url: body.coverImageUrl?.trim() || null,
        is_public: Boolean(body.isPublic),
        sync_status: "pending",
        sync_error: null,
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      return NextResponse.json(
        { ok: false, message: error?.message ?? "앨범 생성에 실패했습니다." },
        { status: 500 },
      );
    }

    const syncResult = await syncGalleryAlbumById(String(data.id));
    revalidateGalleryPaths(programSlug, String(data.id));

    return NextResponse.json({
      ok: true,
      id: data.id,
      sync: syncResult,
      message: "앨범이 생성되었습니다.",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "앨범 생성 중 오류" },
      { status: 500 },
    );
  }
}
