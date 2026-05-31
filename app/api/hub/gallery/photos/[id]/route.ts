import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { assertAdminFromRequest } from "@/lib/api/adminGuard";
import { isProgramSlug } from "@/lib/gallery/queries";
import { syncGalleryPhotoById } from "@/lib/notion/sync";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function getPhotoById(id: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("gallery_photos")
    .select("id,album_id,program_slug")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

function revalidateGalleryPaths(programSlug: string, albumId: string) {
  revalidatePath("/gallery");
  revalidatePath(`/gallery/${programSlug}`);
  revalidatePath(`/gallery/${programSlug}/${albumId}`);
  revalidatePath("/hub/gallery");
  revalidatePath("/hub/notion");
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const unauthorized = assertAdminFromRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await params;

  try {
    const body = (await request.json()) as {
      programSlug?: string;
      imageUrl?: string;
      title?: string;
      description?: string;
      takenAt?: string;
      sortOrder?: number;
      isPublic?: boolean;
    };

    const updates: Record<string, unknown> = {
      sync_status: "pending",
      sync_error: null,
    };

    if (body.programSlug !== undefined) {
      if (!isProgramSlug(body.programSlug)) {
        return NextResponse.json(
          { ok: false, message: "유효한 programSlug가 필요합니다." },
          { status: 400 },
        );
      }
      updates.program_slug = body.programSlug;
    }
    if (body.imageUrl !== undefined) {
      updates.image_url = body.imageUrl.trim();
    }
    if (body.title !== undefined) {
      updates.title = body.title.trim() || null;
    }
    if (body.description !== undefined) {
      updates.description = body.description.trim() || null;
    }
    if (body.takenAt !== undefined) {
      updates.taken_at = body.takenAt.trim() || null;
    }
    if (body.sortOrder !== undefined) {
      updates.sort_order = Number.isFinite(body.sortOrder) ? body.sortOrder : 0;
    }
    if (body.isPublic !== undefined) {
      updates.is_public = Boolean(body.isPublic);
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("gallery_photos").update(updates).eq("id", id);
    if (error) {
      return NextResponse.json(
        { ok: false, message: error.message || "사진 수정에 실패했습니다." },
        { status: 500 },
      );
    }

    const syncResult = await syncGalleryPhotoById(id);
    const photo = await getPhotoById(id);
    if (photo && isProgramSlug(String(photo.program_slug ?? ""))) {
      revalidateGalleryPaths(String(photo.program_slug), String(photo.album_id));
    } else {
      revalidatePath("/gallery");
      revalidatePath("/hub/gallery");
    }

    return NextResponse.json({
      ok: true,
      sync: syncResult,
      message: "사진이 수정되었습니다.",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "사진 수정 중 오류" },
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
  const photo = await getPhotoById(id);
  if (!photo) {
    return NextResponse.json({ ok: false, message: "사진을 찾을 수 없습니다." }, { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("gallery_photos").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  const programSlug = String(photo.program_slug ?? "");
  const albumId = String(photo.album_id ?? "");
  if (isProgramSlug(programSlug)) {
    revalidateGalleryPaths(programSlug, albumId);
  } else {
    revalidatePath("/gallery");
    revalidatePath("/hub/gallery");
  }

  return NextResponse.json({ ok: true, message: "사진이 삭제되었습니다." });
}
