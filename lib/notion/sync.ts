import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getNotionClient, isNotionConfigured } from "@/lib/notion/client";
import { getOrEnsureNotionDatabaseId, type NotionDatabaseKey } from "@/lib/notion/setup";

interface SyncSingleResult {
  table: NotionDatabaseKey;
  id: string;
  ok: boolean;
  notionPageId: string | null;
  message: string;
}

function richText(content: string) {
  if (!content.trim()) {
    return [];
  }
  return [
    {
      type: "text" as const,
      text: { content: content.slice(0, 1900) },
    },
  ];
}

function titleText(content: string) {
  return [
    {
      type: "text" as const,
      text: { content: (content || "Untitled").slice(0, 1900) },
    },
  ];
}

function toDateStart(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const normalized = value.includes("T") ? value.slice(0, 10) : value;
  return normalized || null;
}

function safeMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 500);
  }
  return "알 수 없는 동기화 오류";
}

async function upsertNotionPage(
  tableKey: NotionDatabaseKey,
  rowId: string,
  row: Record<string, unknown>,
) {
  const notion = getNotionClient();
  if (!notion || !isNotionConfigured()) {
    throw new Error("Notion 환경변수가 설정되지 않았습니다.");
  }

  const databaseId = await getOrEnsureNotionDatabaseId(tableKey);
  if (!databaseId) {
    throw new Error(`Notion DB ID를 찾을 수 없습니다: ${tableKey}`);
  }

  const propertiesByTable: Record<NotionDatabaseKey, Record<string, unknown>> = {
    gallery_albums: {
      Title: { title: titleText(String(row.title ?? "")) },
      "Program Slug": {
        rich_text: richText(String(row.program_slug ?? "")),
      },
      "Event Date": {
        date: toDateStart(row.event_date) ? { start: toDateStart(row.event_date) } : null,
      },
      Location: {
        rich_text: richText(String(row.location ?? "")),
      },
      Description: {
        rich_text: richText(String(row.description ?? "")),
      },
      "Cover Image URL": {
        url: typeof row.cover_image_url === "string" ? row.cover_image_url : null,
      },
      Public: {
        checkbox: Boolean(row.is_public),
      },
      "Supabase ID": {
        rich_text: richText(String(row.id ?? rowId)),
      },
      "Created At": {
        date: toDateStart(row.created_at) ? { start: toDateStart(row.created_at) } : null,
      },
    },
    gallery_photos: {
      Title: { title: titleText(String(row.title ?? "사진")) },
      "Album ID": {
        rich_text: richText(String(row.album_id ?? "")),
      },
      "Program Slug": {
        rich_text: richText(String(row.program_slug ?? "")),
      },
      "Image URL": {
        url: typeof row.image_url === "string" ? row.image_url : null,
      },
      Description: {
        rich_text: richText(String(row.description ?? "")),
      },
      "Taken At": {
        date: toDateStart(row.taken_at) ? { start: toDateStart(row.taken_at) } : null,
      },
      "Sort Order": {
        number: typeof row.sort_order === "number" ? row.sort_order : Number(row.sort_order ?? 0),
      },
      Public: {
        checkbox: Boolean(row.is_public),
      },
      "Supabase ID": {
        rich_text: richText(String(row.id ?? rowId)),
      },
      "Created At": {
        date: toDateStart(row.created_at) ? { start: toDateStart(row.created_at) } : null,
      },
    },
    inquiries: {
      Name: { title: titleText(String(row.name ?? "문의")) },
      Phone: {
        rich_text: richText(String(row.phone ?? "")),
      },
      Email: {
        email: typeof row.email === "string" ? row.email : null,
      },
      "Program Slug": {
        rich_text: richText(String(row.program_slug ?? row.program_interest ?? "")),
      },
      Message: {
        rich_text: richText(String(row.message ?? "")),
      },
      Status: {
        select: { name: String(row.status ?? "new") },
      },
      "Supabase ID": {
        rich_text: richText(String(row.id ?? rowId)),
      },
      "Created At": {
        date: toDateStart(row.created_at) ? { start: toDateStart(row.created_at) } : null,
      },
    },
    calendar_events: {
      Title: { title: titleText(String(row.title ?? "일정")) },
      "Program Slug": {
        rich_text: richText(String(row.program_slug ?? row.program_name ?? "")),
      },
      "Event Date": {
        date: toDateStart(row.event_date ?? row.date)
          ? { start: toDateStart(row.event_date ?? row.date) }
          : null,
      },
      "Start Time": {
        rich_text: richText(String(row.start_time ?? "")),
      },
      "End Time": {
        rich_text: richText(String(row.end_time ?? "")),
      },
      Location: {
        rich_text: richText(String(row.location ?? "")),
      },
      Description: {
        rich_text: richText(String(row.description ?? row.memo ?? "")),
      },
      Public: {
        checkbox: Boolean(row.is_public),
      },
      "Supabase ID": {
        rich_text: richText(String(row.id ?? rowId)),
      },
      "Created At": {
        date: toDateStart(row.created_at) ? { start: toDateStart(row.created_at) } : null,
      },
    },
  };

  const notionPageId = typeof row.notion_page_id === "string" ? row.notion_page_id : null;
  const properties = propertiesByTable[tableKey];

  if (notionPageId) {
    await notion.pages.update({
      page_id: notionPageId,
      properties: properties as never,
    });
    return notionPageId;
  }

  const created = await notion.pages.create({
    parent: {
      database_id: databaseId,
    },
    properties: properties as never,
  });

  return created.id;
}

async function writeSyncSuccess(
  table: NotionDatabaseKey,
  id: string,
  notionPageId: string,
) {
  const supabase = getSupabaseAdmin();
  await supabase
    .from(table)
    .update({
      notion_page_id: notionPageId,
      sync_status: "synced",
      sync_error: null,
    })
    .eq("id", id);
}

async function writeSyncFailure(table: NotionDatabaseKey, id: string, message: string) {
  const supabase = getSupabaseAdmin();
  await supabase
    .from(table)
    .update({
      sync_status: "failed",
      sync_error: message.slice(0, 500),
    })
    .eq("id", id);
}

async function syncSingle(table: NotionDatabaseKey, id: string): Promise<SyncSingleResult> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle();

  if (error || !data) {
    return {
      table,
      id,
      ok: false,
      notionPageId: null,
      message: error?.message ?? "동기화 대상 데이터를 찾을 수 없습니다.",
    };
  }

  try {
    const notionPageId = await upsertNotionPage(table, id, data as Record<string, unknown>);
    await writeSyncSuccess(table, id, notionPageId);
    return {
      table,
      id,
      ok: true,
      notionPageId,
      message: "동기화 완료",
    };
  } catch (syncError) {
    const message = safeMessage(syncError);
    await writeSyncFailure(table, id, message);
    return {
      table,
      id,
      ok: false,
      notionPageId: null,
      message,
    };
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function syncGalleryAlbumById(id: string) {
  return syncSingle("gallery_albums", id);
}

export async function syncGalleryPhotoById(id: string) {
  return syncSingle("gallery_photos", id);
}

export async function syncInquiryById(id: string) {
  return syncSingle("inquiries", id);
}

export async function syncCalendarEventById(id: string) {
  return syncSingle("calendar_events", id);
}

interface SyncBulkOptions {
  onlyFailed?: boolean;
}

export async function syncAllPendingRecords(options: SyncBulkOptions = {}) {
  if (!isNotionConfigured()) {
    return {
      ok: false,
      message: "Notion 환경변수가 설정되지 않았습니다.",
      results: [] as SyncSingleResult[],
    };
  }

  const supabase = getSupabaseAdmin();
  const results: SyncSingleResult[] = [];

  for (const table of [
    "gallery_albums",
    "gallery_photos",
    "inquiries",
    "calendar_events",
  ] as const) {
    let query = supabase.from(table).select("id,sync_status").order("created_at", { ascending: true });
    if (options.onlyFailed) {
      query = query.eq("sync_status", "failed");
    } else {
      query = query.neq("sync_status", "synced");
    }

    const { data, error } = await query;
    if (error) {
      results.push({
        table,
        id: "-",
        ok: false,
        notionPageId: null,
        message: error.message,
      });
      continue;
    }

    for (const row of data ?? []) {
      const id = String((row as Record<string, unknown>).id ?? "");
      if (!id) {
        continue;
      }
      const result = await syncSingle(table, id);
      results.push(result);
      await sleep(150);
    }
  }

  const failed = results.filter((result) => !result.ok);
  return {
    ok: failed.length === 0,
    message:
      failed.length === 0
        ? "동기화가 완료되었습니다."
        : `${failed.length}건 동기화 실패가 발생했습니다.`,
    results,
  };
}
