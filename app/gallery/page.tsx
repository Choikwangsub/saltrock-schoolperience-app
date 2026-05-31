import type { Metadata } from "next";
import { ProgramFolderGrid } from "@/components/gallery/ProgramFolderGrid";
import { getPublicGalleryProgramFolders } from "@/lib/gallery/queries";

export const metadata: Metadata = {
  title: "갤러리 | SaltRock Schoolperience",
  description: "프로그램별 폴더 구조로 보는 SaltRock Schoolperience 체험학습 갤러리",
};

export default async function GalleryPage() {
  const folders = await getPublicGalleryProgramFolders();

  return <ProgramFolderGrid items={folders} />;
}
