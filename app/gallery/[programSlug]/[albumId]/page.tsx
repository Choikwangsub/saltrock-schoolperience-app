import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import { PhotoGrid } from "@/components/gallery/PhotoGrid";
import {
  getPublicAlbumById,
  getPublicPhotosByAlbum,
  isProgramSlug,
} from "@/lib/gallery/queries";
import { getPrograms } from "@/lib/programs";

interface AlbumPhotoPageProps {
  params: Promise<{ programSlug: string; albumId: string }>;
}

function formatDate(value: string | null) {
  if (!value) {
    return "날짜 미정";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(parsed);
}

function getProgramTitle(slug: string) {
  return getPrograms().find((program) => program.slug === slug)?.title ?? slug;
}

export async function generateMetadata({
  params,
}: AlbumPhotoPageProps): Promise<Metadata> {
  const { programSlug, albumId } = await params;
  if (!isProgramSlug(programSlug)) {
    return { title: "앨범 | SaltRock Schoolperience" };
  }

  const programTitle = getProgramTitle(programSlug);
  return {
    title: `${programTitle} 앨범 | SaltRock Schoolperience`,
    description: `${programTitle} 프로그램의 앨범 사진 목록 (${albumId})`,
  };
}

export default async function AlbumPhotoPage({ params }: AlbumPhotoPageProps) {
  const { programSlug, albumId } = await params;
  if (!isProgramSlug(programSlug)) {
    notFound();
  }

  const [album, photosResult] = await Promise.all([
    getPublicAlbumById(programSlug, albumId),
    getPublicPhotosByAlbum(programSlug, albumId),
  ]);

  if (!album) {
    notFound();
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/gallery/${programSlug}`}
          className="inline-flex items-center gap-2 rounded-xl border border-brand-primary/15 bg-white px-3 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-cream"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          앨범 목록으로
        </Link>
        <Link
          href="/gallery"
          className="inline-flex items-center gap-2 rounded-xl border border-brand-primary/15 bg-white px-3 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-cream"
        >
          프로그램 폴더로
        </Link>
      </div>

      <header className="mt-4 rounded-3xl border border-brand-primary/12 bg-white p-5 shadow-soft md:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-secondary">
          {getProgramTitle(programSlug)}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-black text-brand-primary">{album.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-foreground/80">
          {album.description || "앨범 설명이 등록되지 않았습니다."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-brand-primary/80">
          <p className="inline-flex items-center gap-1">
            <CalendarDays className="h-4 w-4" aria-hidden />
            {formatDate(album.eventDate)}
          </p>
          <p className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4" aria-hidden />
            {album.location || "장소 미정"}
          </p>
          <p>사진 {photosResult.items.length}장</p>
        </div>
        {photosResult.errorMessage ? (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
            사진 데이터를 불러오는 중 일부 오류가 발생하여 기본 데이터로 표시 중입니다.
          </p>
        ) : null}
      </header>

      <div className="mt-6">
        <PhotoGrid photos={photosResult.items} />
      </div>
    </section>
  );
}
