import "server-only";

import type { Inquiry, Program } from "@/lib/types";

const notionApiToken = process.env.NOTION_API_TOKEN;
const notionProgramsDatabaseId = process.env.NOTION_PROGRAMS_DB_ID;
const notionInquiryDatabaseId = process.env.NOTION_INQUIRY_DB_ID;

/**
 * TODO:
 * 1) Notion SDK 설치 후 클라이언트 초기화
 * 2) 프로그램 DB 조회 결과를 Program 타입으로 매핑
 * 3) 공개 여부(isPublished) 필터 및 정렬(sortOrder) 적용
 */
export async function fetchProgramsFromNotion(): Promise<Program[]> {
  if (!notionApiToken || !notionProgramsDatabaseId) {
    return [];
  }

  return [];
}

/**
 * TODO:
 * 1) 문의 데이터를 Notion DB 속성으로 매핑
 * 2) status 기본값 처리 및 운영자 확인 필드 확장
 */
export async function saveInquiryToNotion(_inquiry: Inquiry): Promise<{
  ok: boolean;
}> {
  void _inquiry;

  if (!notionApiToken || !notionInquiryDatabaseId) {
    return { ok: false };
  }

  return { ok: false };
}
