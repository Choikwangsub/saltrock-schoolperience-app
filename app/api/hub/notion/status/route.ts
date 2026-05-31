import { NextResponse } from "next/server";
import { assertAdminFromRequest } from "@/lib/api/adminGuard";
import { getNotionSetupStatus } from "@/lib/notion/setup";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const unauthorized = assertAdminFromRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const setupStatus = await getNotionSetupStatus();
    const supabase = getSupabaseAdmin();

    const [albums, photos, inquiries, events] = await Promise.all([
      supabase
        .from("gallery_albums")
        .select("id", { count: "exact", head: true })
        .neq("sync_status", "synced"),
      supabase
        .from("gallery_photos")
        .select("id", { count: "exact", head: true })
        .neq("sync_status", "synced"),
      supabase
        .from("inquiries")
        .select("id", { count: "exact", head: true })
        .neq("sync_status", "synced"),
      supabase
        .from("calendar_events")
        .select("id", { count: "exact", head: true })
        .neq("sync_status", "synced"),
    ]);

    return NextResponse.json({
      ok: true,
      setupStatus,
      unsyncedCounts: {
        galleryAlbums: albums.count ?? 0,
        galleryPhotos: photos.count ?? 0,
        inquiries: inquiries.count ?? 0,
        calendarEvents: events.count ?? 0,
      },
      queryErrors: [albums.error, photos.error, inquiries.error, events.error]
        .filter(Boolean)
        .map((error) => error?.message),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "상태 조회 중 오류" },
      { status: 500 },
    );
  }
}
