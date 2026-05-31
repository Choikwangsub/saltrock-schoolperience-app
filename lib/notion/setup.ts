import "server-only";

import type { Client } from "@notionhq/client";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getNotionClient, getNotionParentPageId, isNotionConfigured } from "@/lib/notion/client";

export const NOTION_DATABASE_KEYS = [
  "gallery_albums",
  "gallery_photos",
  "inquiries",
  "calendar_events",
] as const;

export type NotionDatabaseKey = (typeof NOTION_DATABASE_KEYS)[number];

export interface NotionDatabaseDefinition {
  key: NotionDatabaseKey;
  name: string;
  properties: Record<string, unknown>;
}

interface EnsureSingleDatabaseResult {
  key: NotionDatabaseKey;
  name: string;
  databaseId: string | null;
  status: "found" | "created" | "error";
  message: string;
}

const databaseDefinitions: NotionDatabaseDefinition[] = [
  {
    key: "gallery_albums",
    name: "SaltRock Gallery Albums",
    properties: {
      Title: { title: {} },
      "Program Slug": { rich_text: {} },
      "Event Date": { date: {} },
      Location: { rich_text: {} },
      Description: { rich_text: {} },
      "Cover Image URL": { url: {} },
      Public: { checkbox: {} },
      "Supabase ID": { rich_text: {} },
      "Created At": { date: {} },
    },
  },
  {
    key: "gallery_photos",
    name: "SaltRock Gallery Photos",
    properties: {
      Title: { title: {} },
      "Album ID": { rich_text: {} },
      "Program Slug": { rich_text: {} },
      "Image URL": { url: {} },
      Description: { rich_text: {} },
      "Taken At": { date: {} },
      "Sort Order": { number: { format: "number" } },
      Public: { checkbox: {} },
      "Supabase ID": { rich_text: {} },
      "Created At": { date: {} },
    },
  },
  {
    key: "inquiries",
    name: "SaltRock Inquiries",
    properties: {
      Name: { title: {} },
      Phone: { rich_text: {} },
      Email: { email: {} },
      "Program Slug": { rich_text: {} },
      Message: { rich_text: {} },
      Status: {
        select: {
          options: [
            { name: "new", color: "blue" },
            { name: "contacted", color: "yellow" },
            { name: "confirmed", color: "green" },
            { name: "completed", color: "purple" },
            { name: "cancelled", color: "red" },
          ],
        },
      },
      "Supabase ID": { rich_text: {} },
      "Created At": { date: {} },
    },
  },
  {
    key: "calendar_events",
    name: "SaltRock Calendar Events",
    properties: {
      Title: { title: {} },
      "Program Slug": { rich_text: {} },
      "Event Date": { date: {} },
      "Start Time": { rich_text: {} },
      "End Time": { rich_text: {} },
      Location: { rich_text: {} },
      Description: { rich_text: {} },
      Public: { checkbox: {} },
      "Supabase ID": { rich_text: {} },
      "Created At": { date: {} },
    },
  },
];

export function getNotionDatabaseDefinition(key: NotionDatabaseKey) {
  return databaseDefinitions.find((definition) => definition.key === key) ?? null;
}

const databaseIdCache = new Map<NotionDatabaseKey, string>();

async function listChildDatabaseMap(notion: Client, pageId: string) {
  const map = new Map<string, string>();
  let cursor: string | undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const block of response.results) {
      if (!("type" in block)) {
        continue;
      }
      if (block.type === "child_database") {
        map.set(block.child_database.title, block.id);
      }
    }

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  return map;
}

async function saveDatabaseIdToMapTable(key: NotionDatabaseKey, name: string, databaseId: string) {
  const supabase = getSupabaseAdmin();
  await supabase.from("notion_database_map").upsert(
    {
      key,
      name,
      notion_database_id: databaseId,
    },
    { onConflict: "key" },
  );
  databaseIdCache.set(key, databaseId);
}

async function deleteDatabaseIdFromMapTable(key: NotionDatabaseKey) {
  const supabase = getSupabaseAdmin();
  await supabase.from("notion_database_map").delete().eq("key", key);
  databaseIdCache.delete(key);
}

async function isDatabaseAccessible(notion: Client, databaseId: string) {
  try {
    await notion.databases.retrieve({ database_id: databaseId });
    return true;
  } catch {
    return false;
  }
}

export async function getNotionDatabaseIdFromMap(key: NotionDatabaseKey) {
  if (databaseIdCache.has(key)) {
    return databaseIdCache.get(key) ?? null;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("notion_database_map")
      .select("notion_database_id")
      .eq("key", key)
      .maybeSingle();

    if (error || !data?.notion_database_id) {
      return null;
    }

    databaseIdCache.set(key, data.notion_database_id);
    return data.notion_database_id;
  } catch {
    return null;
  }
}

export async function ensureNotionDatabases() {
  const notion = getNotionClient();
  const parentPageId = getNotionParentPageId();

  if (!notion || !parentPageId || !isNotionConfigured()) {
    return {
      ok: false as const,
      message: "NOTION_TOKEN 또는 NOTION_PAGE_ID가 설정되지 않았습니다.",
      results: [] as EnsureSingleDatabaseResult[],
    };
  }

  try {
    const childMap = await listChildDatabaseMap(notion, parentPageId);
    const results: EnsureSingleDatabaseResult[] = [];

    for (const definition of databaseDefinitions) {
      try {
        const existingMappedId = await getNotionDatabaseIdFromMap(definition.key);
        if (existingMappedId) {
          const isValidMappedId = await isDatabaseAccessible(notion, existingMappedId);
          if (isValidMappedId) {
            results.push({
              key: definition.key,
              name: definition.name,
              databaseId: existingMappedId,
              status: "found",
              message: "notion_database_map에서 DB ID를 불러왔습니다.",
            });
            continue;
          }

          await deleteDatabaseIdFromMapTable(definition.key);
        }

        const existingChildId = childMap.get(definition.name);
        if (existingChildId) {
          await saveDatabaseIdToMapTable(definition.key, definition.name, existingChildId);
          results.push({
            key: definition.key,
            name: definition.name,
            databaseId: existingChildId,
            status: "found",
            message: "NOTION_PAGE_ID 하위에서 기존 DB를 찾았습니다.",
          });
          continue;
        }

        const createPayload = {
          parent: {
            type: "page_id",
            page_id: parentPageId,
          },
          title: [
            {
              type: "text",
              text: { content: definition.name },
            },
          ],
          // Notion SDK typings can lag API schema fields for database creation.
          properties: definition.properties,
        };

        const created = await notion.databases.create(createPayload as never);

        await saveDatabaseIdToMapTable(definition.key, definition.name, created.id);
        results.push({
          key: definition.key,
          name: definition.name,
          databaseId: created.id,
          status: "created",
          message: "Notion 데이터베이스를 새로 생성했습니다.",
        });
      } catch (error) {
        results.push({
          key: definition.key,
          name: definition.name,
          databaseId: null,
          status: "error",
          message: error instanceof Error ? error.message : "DB 생성 중 오류",
        });
      }
    }

    const hasError = results.some((result) => result.status === "error");
    return {
      ok: !hasError,
      message: hasError
        ? "일부 Notion 데이터베이스 설정에 실패했습니다."
        : "Notion 데이터베이스 설정이 완료되었습니다.",
      results,
    };
  } catch (error) {
    return {
      ok: false as const,
      message: error instanceof Error ? error.message : "Notion 설정 중 오류",
      results: [] as EnsureSingleDatabaseResult[],
    };
  }
}

export async function getOrEnsureNotionDatabaseId(key: NotionDatabaseKey) {
  const mappedId = await getNotionDatabaseIdFromMap(key);
  if (mappedId) {
    return mappedId;
  }

  const setupResult = await ensureNotionDatabases();
  if (!setupResult.ok) {
    return null;
  }

  const target = setupResult.results.find((result) => result.key === key);
  return target?.databaseId ?? null;
}

export async function getNotionSetupStatus() {
  const configured = isNotionConfigured();
  const parentPageId = getNotionParentPageId();

  let mapRows: Array<{ key: string; notion_database_id: string; name: string | null }> = [];
  let mapError: string | null = null;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("notion_database_map")
      .select("key, notion_database_id, name")
      .order("key", { ascending: true });

    if (error) {
      mapError = error.message;
    } else {
      mapRows = (data ?? []) as Array<{ key: string; notion_database_id: string; name: string | null }>;
    }
  } catch (error) {
    mapError = error instanceof Error ? error.message : "notion_database_map 조회 실패";
  }

  return {
    configured,
    parentPageId,
    mapRows,
    mapError,
  };
}
