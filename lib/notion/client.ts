import "server-only";

import { Client } from "@notionhq/client";

export function getNotionToken() {
  return process.env.NOTION_TOKEN?.trim() ?? "";
}

export function getNotionParentPageId() {
  return process.env.NOTION_PAGE_ID?.trim() ?? "";
}

export function getNotionClient() {
  const token = getNotionToken();
  if (!token) {
    return null;
  }
  return new Client({ auth: token });
}

export function isNotionConfigured() {
  return Boolean(getNotionToken() && getNotionParentPageId());
}
