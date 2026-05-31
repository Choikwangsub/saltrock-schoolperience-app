import { Client } from "@notionhq/client";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_PAGE_ID = process.env.NOTION_PAGE_ID;

if (!NOTION_TOKEN || !NOTION_PAGE_ID) {
  console.error("Missing NOTION_TOKEN or NOTION_PAGE_ID.");
  process.exit(1);
}

const notion = new Client({ auth: NOTION_TOKEN });

async function findChildDatabaseByTitle(pageId, title) {
  let cursor;

  do {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
      start_cursor: cursor,
    });

    const found = response.results.find((block) => {
      return block.type === "child_database" && block.child_database.title === title;
    });

    if (found) {
      return found.id;
    }

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  return null;
}

async function ensureDatabase({ title, properties }) {
  const existingId = await findChildDatabaseByTitle(NOTION_PAGE_ID, title);
  if (existingId) {
    console.log(`[skip] ${title} already exists (${existingId})`);
    return existingId;
  }

  const created = await notion.databases.create({
    parent: {
      type: "page_id",
      page_id: NOTION_PAGE_ID,
    },
    title: [
      {
        type: "text",
        text: {
          content: title,
        },
      },
    ],
    properties,
  });

  console.log(`[create] ${title} created (${created.id})`);
  return created.id;
}

async function main() {
  const galleryProperties = {
    제목: { title: {} },
    slug: { rich_text: {} },
    카테고리: {
      select: {
        options: [
          { name: "활동형", color: "blue" },
          { name: "모험형", color: "green" },
          { name: "스포츠형", color: "orange" },
          { name: "AI창의형", color: "purple" },
          { name: "행사형", color: "yellow" },
        ],
      },
    },
    설명: { rich_text: {} },
    "이미지 경로": { url: {} },
    "공개 여부": { checkbox: {} },
    "정렬 순서": { number: { format: "number" } },
  };

  const programProperties = {
    제목: { title: {} },
    slug: { rich_text: {} },
    "짧은 설명": { rich_text: {} },
    "상세 설명": { rich_text: {} },
    카테고리: {
      select: {
        options: [
          { name: "activity", color: "blue" },
          { name: "adventure", color: "green" },
          { name: "sports", color: "orange" },
          { name: "recreation", color: "yellow" },
          { name: "ai-creative", color: "purple" },
        ],
      },
    },
    태그: { multi_select: {} },
    "추천 대상": { rich_text: {} },
    "운영 시간": { rich_text: {} },
    "운영 장소": { rich_text: {} },
    "이미지 경로": { url: {} },
    "기본 단가": { number: { format: "won" } },
    "공개 여부": { checkbox: {} },
    "정렬 순서": { number: { format: "number" } },
  };

  await ensureDatabase({
    title: "갤러리 데이터베이스",
    properties: galleryProperties,
  });

  await ensureDatabase({
    title: "프로그램 데이터베이스",
    properties: programProperties,
  });

  console.log("Notion setup completed.");
}

main().catch((error) => {
  console.error("Failed to setup Notion databases:", error);
  process.exit(1);
});
