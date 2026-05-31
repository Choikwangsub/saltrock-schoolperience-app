import "server-only";

import { Client } from "@notionhq/client";
import type { GalleryItem } from "@/lib/types";

const GALLERY_DB_TITLE = "갤러리 데이터베이스";

function getNotionClient() {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    return null;
  }
  return new Client({ auth: token });
}

function getTextFromRichTextBlock(property: unknown): string {
  if (!property || typeof property !== "object") {
    return "";
  }

  const richText = (property as { rich_text?: Array<{ plain_text?: string }> }).rich_text;
  if (!richText || !Array.isArray(richText)) {
    return "";
  }

  return richText.map((item) => item.plain_text ?? "").join("").trim();
}

function getTitleFromProperty(property: unknown): string {
  if (!property || typeof property !== "object") {
    return "";
  }

  const title = (property as { title?: Array<{ plain_text?: string }> }).title;
  if (!title || !Array.isArray(title)) {
    return "";
  }

  return title.map((item) => item.plain_text ?? "").join("").trim();
}

function getNumberFromProperty(property: unknown) {
  if (!property || typeof property !== "object") {
    return 0;
  }
  const value = (property as { number?: number }).number;
  return typeof value === "number" ? value : 0;
}

function getCheckboxFromProperty(property: unknown) {
  if (!property || typeof property !== "object") {
    return false;
  }
  return Boolean((property as { checkbox?: boolean }).checkbox);
}

function getSelectName(property: unknown) {
  if (!property || typeof property !== "object") {
    return "";
  }
  const select = (property as { select?: { name?: string } }).select;
  return select?.name ?? "";
}

function getUrlFromProperty(property: unknown) {
  if (!property || typeof property !== "object") {
    return "";
  }
  const url = (property as { url?: string }).url;
  if (typeof url === "string" && url.trim()) {
    return url.trim();
  }
  return "";
}

async function findChildDatabaseIdByTitle(
  notion: Client,
  pageId: string,
  databaseTitle: string,
) {
  let cursor: string | undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });

    const target = response.results.find((block) => {
      if (!("type" in block)) {
        return false;
      }
      if (block.type !== "child_database") {
        return false;
      }
      return block.child_database?.title === databaseTitle;
    });

    if (target) {
      return target.id;
    }

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  return null;
}

async function resolveDataSourceIdFromDatabaseId(
  notion: Client,
  databaseId: string,
) {
  try {
    const database = await notion.databases.retrieve({ database_id: databaseId });
    if (
      "data_sources" in database &&
      Array.isArray(database.data_sources) &&
      database.data_sources.length > 0
    ) {
      return database.data_sources[0]?.id ?? databaseId;
    }
  } catch {
    return databaseId;
  }

  return databaseId;
}

export async function resolveGalleryDatabaseId() {
  const notion = getNotionClient();
  const parentPageId = process.env.NOTION_PAGE_ID;
  if (!notion || !parentPageId) {
    return null;
  }

  if (process.env.NOTION_GALLERY_DB_ID) {
    return process.env.NOTION_GALLERY_DB_ID;
  }

  try {
    return await findChildDatabaseIdByTitle(notion, parentPageId, GALLERY_DB_TITLE);
  } catch {
    return null;
  }
}

export async function fetchGalleryItemsFromNotion(): Promise<GalleryItem[]> {
  const notion = getNotionClient();
  if (!notion) {
    return [];
  }

  const databaseId = await resolveGalleryDatabaseId();
  if (!databaseId) {
    return [];
  }

  try {
    const dataSourceId = await resolveDataSourceIdFromDatabaseId(notion, databaseId);
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: 100,
      filter: {
        property: "공개 여부",
        checkbox: {
          equals: true,
        },
      },
      sorts: [
        {
          property: "정렬 순서",
          direction: "ascending",
        },
      ],
    });

    return response.results
      .map((result, index) => {
        if (!("properties" in result)) {
          return null;
        }
        const properties = result.properties as Record<string, unknown>;

        const title = getTitleFromProperty(properties["제목"]);
        const slug = getTextFromRichTextBlock(properties["slug"]);
        const category = getSelectName(properties["카테고리"]);
        const description = getTextFromRichTextBlock(properties["설명"]);
        const imagePath = getUrlFromProperty(properties["이미지 경로"]);
        const isPublished = getCheckboxFromProperty(properties["공개 여부"]);
        const sortOrder = getNumberFromProperty(properties["정렬 순서"]) || index + 1;

        if (!title || !slug || !imagePath) {
          return null;
        }

        return {
          id: result.id,
          title,
          slug,
          category: category || "체험학습",
          description: description || "SaltRock Schoolperience 프로그램 갤러리",
          imageUrl: imagePath,
          isPublished,
          sortOrder,
        } satisfies GalleryItem;
      })
      .filter((item): item is GalleryItem => Boolean(item));
  } catch {
    return [];
  }
}
