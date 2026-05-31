import { NextResponse } from "next/server";
import { assertAdminFromRequest } from "@/lib/api/adminGuard";
import { getNotionSetupStatus } from "@/lib/notion/setup";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type FailedItemRow = {
  id: string;
  sync_error: string | null;
  updated_at: string | null;
};

function mapFailedItems(
  table: "gallery_albums" | "gallery_photos" | "inquiries" | "calendar_events",
  rows: FailedItemRow[] | null,
) {
  return (rows ?? []).map((row) => ({
    table,
    id: row.id,
    syncError: row.sync_error || "동기화 실패 사유가 기록되지 않았습니다.",
    updatedAt: row.updated_at,
  }));
}

export async function GET(request: Request) {
  const unauthorized = assertAdminFromRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const setupStatus = await getNotionSetupStatus();
    const supabase = getSupabaseAdmin();

    const [
      albums,
      photos,
      inquiries,
      events,
      failedAlbums,
      failedPhotos,
      failedInquiries,
      failedEvents,
    ] = await Promise.all([
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
      supabase
        .from("gallery_albums")
        .select("id,sync_error,updated_at")
        .eq("sync_status", "failed")
        .order("updated_at", { ascending: false })
        .limit(5),
      supabase
        .from("gallery_photos")
        .select("id,sync_error,updated_at")
        .eq("sync_status", "failed")
        .order("updated_at", { ascending: false })
        .limit(5),
      supabase
        .from("inquiries")
        .select("id,sync_error,updated_at")
        .eq("sync_status", "failed")
        .order("updated_at", { ascending: false })
        .limit(5),
      supabase
        .from("calendar_events")
        .select("id,sync_error,updated_at")
        .eq("sync_status", "failed")
        .order("updated_at", { ascending: false })
        .limit(5),
    ]);

    const failedItems = [
      ...mapFailedItems("gallery_albums", (failedAlbums.data as FailedItemRow[] | null) ?? null),
      ...mapFailedItems("gallery_photos", (failedPhotos.data as FailedItemRow[] | null) ?? null),
      ...mapFailedItems("inquiries", (failedInquiries.data as FailedItemRow[] | null) ?? null),
      ...mapFailedItems("calendar_events", (failedEvents.data as FailedItemRow[] | null) ?? null),
    ]
      .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
      .slice(0, 15);

    return NextResponse.json({
      ok: true,
      setupStatus,
      unsyncedCounts: {
        galleryAlbums: albums.count ?? 0,
        galleryPhotos: photos.count ?? 0,
        inquiries: inquiries.count ?? 0,
        calendarEvents: events.count ?? 0,
      },
      queryErrors: [
        albums.error,
        photos.error,
        inquiries.error,
        events.error,
        failedAlbums.error,
        failedPhotos.error,
        failedInquiries.error,
        failedEvents.error,
      ]
        .filter(Boolean)
        .map((error) => error?.message),
      failedItems,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "상태 조회 중 오류" },
      { status: 500 },
    );
  }
}
