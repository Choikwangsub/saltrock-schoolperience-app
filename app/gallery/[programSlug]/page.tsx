import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AlbumGrid } from "@/components/gallery/AlbumGrid";
import { getPublicAlbumsByProgramSlug, isProgramSlug } from "@/lib/gallery/queries";
import { REQUIRED_PROGRAM_SLUGS } from "@/lib/gallery/types";
import { getPrograms } from "@/lib/programs";

interface ProgramGalleryPageProps {
  params: Promise<{ programSlug: string }>;
}

function getProgramTitle(slug: string) {
  const program = getPrograms().find((item) => item.slug === slug);
  return program?.title ?? slug;
}

export async function generateStaticParams() {
  return REQUIRED_PROGRAM_SLUGS.map((programSlug) => ({ programSlug }));
}

export async function generateMetadata({
  params,
}: ProgramGalleryPageProps): Promise<Metadata> {
  const { programSlug } = await params;
  if (!isProgramSlug(programSlug)) {
    return {
      title: "갤러리 | SaltRock Schoolperience",
    };
  }

  const title = getProgramTitle(programSlug);
  return {
    title: `${title} 갤러리 | SaltRock Schoolperience`,
    description: `${title} 프로그램의 행사 앨범 목록`,
  };
}

export default async function ProgramGalleryPage({ params }: ProgramGalleryPageProps) {
  const { programSlug } = await params;
  if (!isProgramSlug(programSlug)) {
    notFound();
  }

  const title = getProgramTitle(programSlug);
  const albumsResult = await getPublicAlbumsByProgramSlug(programSlug);

  return (
    <>
      <section className="mx-auto w-full max-w-7xl px-4 pb-2 pt-8 sm:px-6 lg:px-8">
        <Link
          href="/gallery"
          className="inline-flex items-center gap-2 rounded-xl border border-brand-primary/15 bg-white px-3 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-cream"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          프로그램 폴더 목록으로
        </Link>
        {albumsResult.errorMessage ? (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
            갤러리 데이터를 불러오는 중 일부 오류가 발생했습니다. 기본 데이터로 표시 중입니다.
          </p>
        ) : null}
      </section>
      <AlbumGrid programSlug={programSlug} programTitle={title} albums={albumsResult.items} />
    </>
  );
}
