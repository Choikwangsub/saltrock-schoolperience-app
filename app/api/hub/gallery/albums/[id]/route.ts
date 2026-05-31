import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { assertAdminFromRequest } from "@/lib/api/adminGuard";
import { isProgramSlug } from "@/lib/gallery/queries";
import { syncGalleryAlbumById } from "@/lib/notion/sync";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function revalidateGalleryPaths(programSlug: string, albumId: string) {
  revalidatePath("/gallery");
  revalidatePath(`/gallery/${programSlug}`);
  revalidatePath(`/gallery/${programSlug}/${albumId}`);
  revalidatePath("/hub/gallery");
  revalidatePath("/hub/notion");
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function getAlbumById(id: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("gallery_albums")
    .select("id,program_slug")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const unauthorized = assertAdminFromRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await params;

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

    const updates: Record<string, unknown> = {
      sync_status: "pending",
      sync_error: null,
    };

    if (body.title !== undefined) {
      updates.title = body.title.trim();
    }
    if (body.programSlug !== undefined) {
      if (!isProgramSlug(body.programSlug)) {
        return NextResponse.json(
          { ok: false, message: "유효한 programSlug가 필요합니다." },
          { status: 400 },
        );
      }
      updates.program_slug = body.programSlug;
    }
    if (body.eventDate !== undefined) {
      updates.event_date = body.eventDate.trim() || null;
    }
    if (body.location !== undefined) {
      updates.location = body.location.trim() || null;
    }
    if (body.description !== undefined) {
      updates.description = body.description.trim() || null;
    }
    if (body.coverImageUrl !== undefined) {
      updates.cover_image_url = body.coverImageUrl.trim() || null;
    }
    if (body.isPublic !== undefined) {
      updates.is_public = Boolean(body.isPublic);
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("gallery_albums").update(updates).eq("id", id);
    if (error) {
      return NextResponse.json(
        { ok: false, message: error.message || "앨범 수정에 실패했습니다." },
        { status: 500 },
      );
    }

    const syncResult = await syncGalleryAlbumById(id);
    const album = await getAlbumById(id);
    const programSlug = String(album?.program_slug ?? body.programSlug ?? "");
    if (isProgramSlug(programSlug)) {
      revalidateGalleryPaths(programSlug, id);
    } else {
      revalidatePath("/gallery");
      revalidatePath("/hub/gallery");
    }

    return NextResponse.json({
      ok: true,
      sync: syncResult,
      message: "앨범이 수정되었습니다.",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "앨범 수정 중 오류" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const unauthorized = assertAdminFromRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await params;
  const album = await getAlbumById(id);
  if (!album) {
    return NextResponse.json({ ok: false, message: "앨범을 찾을 수 없습니다." }, { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("gallery_albums").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  const programSlug = String(album.program_slug ?? "");
  if (isProgramSlug(programSlug)) {
    revalidateGalleryPaths(programSlug, id);
  } else {
    revalidatePath("/gallery");
    revalidatePath("/hub/gallery");
  }

  return NextResponse.json({ ok: true, message: "앨범이 삭제되었습니다." });
}
