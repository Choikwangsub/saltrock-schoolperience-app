import type { Metadata } from "next";
import { GalleryGrid } from "@/components/GalleryGrid";
import { getGalleryItems } from "@/lib/gallery";

export const metadata: Metadata = {
  title: "갤러리 | SaltRock Schoolperience",
  description: "SaltRock Schoolperience 체험학습 현장 갤러리",
};

export default async function GalleryPage() {
  const items = await getGalleryItems();

  return <GalleryGrid items={items} />;
}
