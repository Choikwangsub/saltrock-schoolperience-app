import "server-only";

import { getPrograms } from "@/lib/programs";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabasePublic } from "@/lib/supabase/public";
import type {
  GalleryAlbumRecord,
  GalleryPhotoRecord,
  GalleryProgramFolder,
  GalleryQueryResult,
  ProgramSlug,
  SyncStatus,
} from "@/lib/gallery/types";
import { REQUIRED_PROGRAM_SLUGS } from "@/lib/gallery/types";

function toNullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toSyncStatus(value: unknown): SyncStatus {
  if (value === "synced" || value === "failed" || value === "pending") {
    return value;
  }
  return "pending";
}

function toProgramSlug(value: unknown): ProgramSlug {
  const text = typeof value === "string" ? value : "";
  if ((REQUIRED_PROGRAM_SLUGS as readonly string[]).includes(text)) {
    return text as ProgramSlug;
  }
  return "laser-survival";
}

function mapAlbumRow(row: Record<string, unknown>): GalleryAlbumRecord {
  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    programSlug: toProgramSlug(row.program_slug),
    eventDate: toNullableString(row.event_date),
    location: toNullableString(row.location),
    description: toNullableString(row.description),
    coverImageUrl: toNullableString(row.cover_image_url),
    isPublic: Boolean(row.is_public),
    notionPageId: toNullableString(row.notion_page_id),
    syncStatus: toSyncStatus(row.sync_status),
    syncError: toNullableString(row.sync_error),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
    photoCount: Number(row.photo_count ?? 0),
  };
}

function mapPhotoRow(row: Record<string, unknown>): GalleryPhotoRecord {
  return {
    id: String(row.id ?? ""),
    albumId: String(row.album_id ?? ""),
    programSlug: toProgramSlug(row.program_slug),
    imageUrl: String(row.image_url ?? ""),
    title: toNullableString(row.title),
    description: toNullableString(row.description),
    takenAt: toNullableString(row.taken_at),
    sortOrder: Number(row.sort_order ?? 0),
    isPublic: Boolean(row.is_public),
    notionPageId: toNullableString(row.notion_page_id),
    syncStatus: toSyncStatus(row.sync_status),
    syncError: toNullableString(row.sync_error),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

function getProgramMetaMap() {
  const map = new Map<
    ProgramSlug,
    { title: string; description: string; coverImageUrl: string }
  >();

  for (const program of getPrograms()) {
    if ((REQUIRED_PROGRAM_SLUGS as readonly string[]).includes(program.slug)) {
      map.set(program.slug as ProgramSlug, {
        title: program.title,
        description: program.shortDescription,
        coverImageUrl: program.imageUrl,
      });
    }
  }

  for (const slug of REQUIRED_PROGRAM_SLUGS) {
    if (!map.has(slug)) {
      map.set(slug, {
        title: slug,
        description: "체험학습 프로그램",
        coverImageUrl: `/programs/${slug}.jpg`,
      });
    }
  }

  return map;
}

function getFallbackAlbum(slug: ProgramSlug): GalleryAlbumRecord {
  const meta = getProgramMetaMap().get(slug);
  const now = new Date().toISOString();
  return {
    id: `sample-${slug}`,
    title: `${meta?.title ?? slug} 샘플 앨범`,
    programSlug: slug,
    eventDate: null,
    location: "현장 사진 준비중",
    description: "DB 연결 전에도 화면이 깨지지 않도록 제공되는 샘플 앨범입니다.",
    coverImageUrl: meta?.coverImageUrl ?? `/programs/${slug}.jpg`,
    isPublic: true,
    notionPageId: null,
    syncStatus: "pending",
    syncError: null,
    createdAt: now,
    updatedAt: now,
    photoCount: 1,
  };
}

function getFallbackPhoto(slug: ProgramSlug, albumId: string): GalleryPhotoRecord {
  const meta = getProgramMetaMap().get(slug);
  const now = new Date().toISOString();
  return {
    id: `sample-photo-${slug}`,
    albumId,
    programSlug: slug,
    imageUrl: meta?.coverImageUrl ?? `/programs/${slug}.jpg`,
    title: `${meta?.title ?? slug} 샘플 사진`,
    description: "갤러리 초기 설정 전 샘플 이미지입니다.",
    takenAt: null,
    sortOrder: 1,
    isPublic: true,
    notionPageId: null,
    syncStatus: "pending",
    syncError: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function isProgramSlug(slug: string): slug is ProgramSlug {
  return (REQUIRED_PROGRAM_SLUGS as readonly string[]).includes(slug);
}

export async function getPublicGalleryProgramFolders(): Promise<GalleryProgramFolder[]> {
  const programMetaMap = getProgramMetaMap();
  const countMap = new Map<ProgramSlug, number>();

  try {
    const supabase = getSupabasePublic();
    const { data, error } = await supabase
      .from("gallery_albums")
      .select("program_slug")
      .eq("is_public", true);

    if (!error) {
      for (const row of data ?? []) {
        const slug = toProgramSlug((row as Record<string, unknown>).program_slug);
        countMap.set(slug, (countMap.get(slug) ?? 0) + 1);
      }
    }
  } catch {
    // Fallback to zero counts.
  }

  return REQUIRED_PROGRAM_SLUGS.map((slug) => {
    const meta = programMetaMap.get(slug);
    return {
      slug,
      title: meta?.title ?? slug,
      description: meta?.description ?? "체험학습 프로그램",
      coverImageUrl: meta?.coverImageUrl ?? `/programs/${slug}.jpg`,
      publicAlbumCount: countMap.get(slug) ?? 0,
    };
  });
}

async function mergePhotoCounts(
  albums: GalleryAlbumRecord[],
  includePrivatePhotos: boolean,
): Promise<GalleryAlbumRecord[]> {
  if (albums.length === 0) {
    return albums;
  }

  try {
    const supabase = getSupabasePublic();
    let query = supabase
      .from("gallery_photos")
      .select("album_id")
      .in(
        "album_id",
        albums.map((album) => album.id),
      );

    if (!includePrivatePhotos) {
      query = query.eq("is_public", true);
    }

    const { data, error } = await query;
    if (error) {
      return albums;
    }

    const counter = new Map<string, number>();
    for (const row of data ?? []) {
      const albumId = String((row as Record<string, unknown>).album_id ?? "");
      if (!albumId) {
        continue;
      }
      counter.set(albumId, (counter.get(albumId) ?? 0) + 1);
    }

    return albums.map((album) => ({ ...album, photoCount: counter.get(album.id) ?? 0 }));
  } catch {
    return albums;
  }
}

export async function getPublicAlbumsByProgramSlug(
  programSlug: ProgramSlug,
): Promise<GalleryQueryResult<GalleryAlbumRecord>> {
  try {
    const supabase = getSupabasePublic();
    const { data, error } = await supabase
      .from("gallery_albums")
      .select("*")
      .eq("program_slug", programSlug)
      .eq("is_public", true)
      .order("event_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      return {
        items: [getFallbackAlbum(programSlug)],
        usedFallback: true,
        errorMessage: error.message,
      };
    }

    const albums = (data ?? []).map((row) => mapAlbumRow(row as Record<string, unknown>));
    const merged = await mergePhotoCounts(albums, false);
    return { items: merged, usedFallback: false, errorMessage: null };
  } catch (error) {
    return {
      items: [getFallbackAlbum(programSlug)],
      usedFallback: true,
      errorMessage: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

export async function getPublicPhotosByAlbum(
  programSlug: ProgramSlug,
  albumId: string,
): Promise<GalleryQueryResult<GalleryPhotoRecord>> {
  if (albumId === `sample-${programSlug}`) {
    return {
      items: [getFallbackPhoto(programSlug, albumId)],
      usedFallback: true,
      errorMessage: null,
    };
  }

  try {
    const supabase = getSupabasePublic();

    const { data: albumData, error: albumError } = await supabase
      .from("gallery_albums")
      .select("id,is_public,program_slug")
      .eq("id", albumId)
      .single();

    if (albumError) {
      return {
        items: [getFallbackPhoto(programSlug, albumId)],
        usedFallback: true,
        errorMessage: albumError.message,
      };
    }

    const matchedProgramSlug = String((albumData as Record<string, unknown>).program_slug ?? "");
    const isPublic = Boolean((albumData as Record<string, unknown>).is_public);
    if (matchedProgramSlug !== programSlug || !isPublic) {
      return {
        items: [],
        usedFallback: false,
        errorMessage: "공개된 앨범을 찾을 수 없습니다.",
      };
    }

    const { data, error } = await supabase
      .from("gallery_photos")
      .select("*")
      .eq("album_id", albumId)
      .eq("is_public", true)
      .order("sort_order", { ascending: true })
      .order("taken_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: true });

    if (error) {
      return {
        items: [getFallbackPhoto(programSlug, albumId)],
        usedFallback: true,
        errorMessage: error.message,
      };
    }

    return {
      items: (data ?? []).map((row) => mapPhotoRow(row as Record<string, unknown>)),
      usedFallback: false,
      errorMessage: null,
    };
  } catch (error) {
    return {
      items: [getFallbackPhoto(programSlug, albumId)],
      usedFallback: true,
      errorMessage: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

export async function getPublicAlbumById(
  programSlug: ProgramSlug,
  albumId: string,
): Promise<GalleryAlbumRecord | null> {
  if (albumId === `sample-${programSlug}`) {
    return getFallbackAlbum(programSlug);
  }

  try {
    const supabase = getSupabasePublic();
    const { data, error } = await supabase
      .from("gallery_albums")
      .select("*")
      .eq("id", albumId)
      .eq("program_slug", programSlug)
      .eq("is_public", true)
      .single();

    if (error || !data) {
      return null;
    }

    return mapAlbumRow(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function getAdminAlbums(programSlug?: ProgramSlug) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("gallery_albums")
    .select("*")
    .order("event_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (programSlug) {
    query = query.eq("program_slug", programSlug);
  }

  const { data, error } = await query;
  if (error) {
    return { ok: false as const, message: error.message, items: [] as GalleryAlbumRecord[] };
  }

  const albums = (data ?? []).map((row) => mapAlbumRow(row as Record<string, unknown>));
  const merged = await mergePhotoCounts(albums, true);
  return { ok: true as const, message: "", items: merged };
}

export async function getAdminPhotos(albumId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("gallery_photos")
    .select("*")
    .eq("album_id", albumId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return { ok: false as const, message: error.message, items: [] as GalleryPhotoRecord[] };
  }

  return {
    ok: true as const,
    message: "",
    items: (data ?? []).map((row) => mapPhotoRow(row as Record<string, unknown>)),
  };
}

export function createStoragePath(programSlug: ProgramSlug, albumId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `gallery/${programSlug}/${albumId}/${safeName}`;
}
