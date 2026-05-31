import { Client } from "@notionhq/client";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_PAGE_ID = process.env.NOTION_PAGE_ID;

if (!NOTION_TOKEN || !NOTION_PAGE_ID) {
  console.error("Missing NOTION_TOKEN or NOTION_PAGE_ID.");
  process.exit(1);
}

const notion = new Client({ auth: NOTION_TOKEN });

const databaseDefinitions = [
  {
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

async function listChildDatabases(pageId) {
  const map = new Map();
  let cursor;

  do {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
      start_cursor: cursor,
    });

    for (const block of response.results) {
      if (block.type === "child_database") {
        map.set(block.child_database.title, block.id);
      }
    }

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  return map;
}

async function ensureDatabase(definition, childMap) {
  const existingId = childMap.get(definition.name);
  if (existingId) {
    console.log(`[skip] ${definition.name} already exists (${existingId})`);
    return existingId;
  }

  const payload = {
    parent: {
      type: "page_id",
      page_id: NOTION_PAGE_ID,
    },
    title: [
      {
        type: "text",
        text: { content: definition.name },
      },
    ],
    properties: definition.properties,
  };

  const created = await notion.databases.create(payload);
  console.log(`[create] ${definition.name} created (${created.id})`);
  return created.id;
}

async function main() {
  const childMap = await listChildDatabases(NOTION_PAGE_ID);

  for (const definition of databaseDefinitions) {
    await ensureDatabase(definition, childMap);
  }

  console.log("Notion database setup finished.");
}

main().catch((error) => {
  console.error("Failed to setup Notion databases:", error);
  process.exit(1);
});
