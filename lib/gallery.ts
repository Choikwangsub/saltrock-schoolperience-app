import "server-only";

import { readdir } from "node:fs/promises";
import path from "node:path";
import { programs } from "@/lib/mockData";
import { fetchGalleryItemsFromNotion } from "@/lib/notion";
import type { GalleryItem } from "@/lib/types";

const imagePattern = /\.(png|jpe?g|webp|gif|avif)$/i;

function guessCategoryFromFilename(filename: string) {
  const text = filename.toLowerCase();
  if (text.includes("ai")) return "AI 창의교육";
  if (text.includes("sports") || text.includes("climbing")) return "스포츠 체험";
  if (text.includes("laser")) return "활동형 프로그램";
  return "체험학습";
}

function formatTitleFromFilename(filename: string) {
  const base = filename.replace(/\.[^/.]+$/, "");
  return base
    .split(/[-_]/g)
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

async function getGalleryFolderItems(): Promise<GalleryItem[]> {
  try {
    const galleryDirectory = path.join(process.cwd(), "public", "gallery");
    const files = await readdir(galleryDirectory);
    return files
      .filter((file) => imagePattern.test(file))
      .map((file, index) => {
        const base = file.replace(/\.[^/.]+$/, "");
        return {
          id: `local-gallery-${base}`,
          title: formatTitleFromFilename(file),
          slug: base,
          category: guessCategoryFromFilename(file),
          description: "SaltRock Schoolperience 현장 사진",
          imageUrl: `/gallery/${file}`,
          isPublished: true,
          sortOrder: index + 1,
        } satisfies GalleryItem;
      });
  } catch {
    return [];
  }
}

function getProgramFallbackItems(): GalleryItem[] {
  return programs
    .filter((program) => program.isPublished)
    .map((program) => ({
      id: `program-${program.id}`,
      title: program.title,
      slug: program.slug,
      category: program.category,
      description: program.shortDescription,
      imageUrl: program.imageUrl,
      isPublished: true,
      sortOrder: program.sortOrder,
    }));
}

export async function getGalleryItems(): Promise<GalleryItem[]> {
  const notionItems = await fetchGalleryItemsFromNotion();
  if (notionItems.length > 0) {
    return notionItems
      .filter((item) => item.isPublished)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  const folderItems = await getGalleryFolderItems();
  const fallbackItems = [...folderItems, ...getProgramFallbackItems()];

  const deduplicated = Array.from(
    new Map(fallbackItems.map((item) => [item.imageUrl, item])).values(),
  );

  return deduplicated.sort((a, b) => a.sortOrder - b.sortOrder);
}
