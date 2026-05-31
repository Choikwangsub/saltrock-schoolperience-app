import "server-only";

import { fetchGalleryItemsFromNotion } from "@/lib/notion";
import type { GalleryItem } from "@/lib/types";

/**
 * NOTE:
 * - 실제 운영 데이터는 lib/notion.ts에서 처리합니다.
 * - 환경변수 미설정/연결 오류 시 빈 배열을 반환하고, 호출부에서 fallback 데이터를 사용합니다.
 */
export async function fetchGalleryFromNotion(): Promise<GalleryItem[]> {
  return fetchGalleryItemsFromNotion();
}
