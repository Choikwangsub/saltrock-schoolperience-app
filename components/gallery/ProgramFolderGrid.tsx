import Link from "next/link";
import { FolderOpen, Images } from "lucide-react";
import { AdaptiveImage } from "@/components/AdaptiveImage";
import { SectionTitle } from "@/components/SectionTitle";
import type { GalleryProgramFolder, ProgramSlug } from "@/lib/gallery/types";
import { PROGRAM_FALLBACK_GRADIENTS } from "@/lib/siteConfig";
import type { ProgramIconKey } from "@/lib/types";

interface ProgramFolderGridProps {
  items: GalleryProgramFolder[];
  previewCount?: number;
  showHeaderLink?: boolean;
}

const iconMap: Record<ProgramSlug, ProgramIconKey> = {
  "laser-survival": "laser-survival",
  "sky-swing": "sky-swing",
  "sports-climbing": "sports-climbing",
  "sports-day": "sports-day",
  "ai-homepage": "ai-homepage",
  "ai-diary": "ai-diary",
};

export function ProgramFolderGrid({
  items,
  previewCount,
  showHeaderLink = false,
}: ProgramFolderGridProps) {
  const renderedItems = previewCount ? items.slice(0, previewCount) : items;

  return (
    <section id="gallery" className="py-16 md:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <SectionTitle
            eyebrow="Gallery"
            title="프로그램별 갤러리 폴더"
            description="프로그램 폴더를 열어 행사 앨범과 사진을 순서대로 확인할 수 있습니다."
            align="left"
          />
          {showHeaderLink ? (
            <Link
              href="/gallery"
              className="inline-flex items-center rounded-xl border border-brand-primary/20 bg-white px-4 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-cream"
            >
              갤러리 전체보기
            </Link>
          ) : null}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {renderedItems.map((item) => (
            <article
              key={item.slug}
              className="group overflow-hidden rounded-3xl border border-brand-primary/10 bg-white p-2 shadow-soft transition hover:-translate-y-1 hover:shadow-[0_22px_44px_rgba(18,54,111,0.18)]"
            >
              <AdaptiveImage
                src={item.coverImageUrl}
                alt={`${item.title} 갤러리 대표 이미지`}
                iconKey={iconMap[item.slug]}
                fallbackGradient={PROGRAM_FALLBACK_GRADIENTS[iconMap[item.slug]]}
                className="aspect-video rounded-2xl"
                imageClassName="object-cover transition duration-500 group-hover:scale-[1.03]"
                fallbackLabel={item.title}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="p-4">
                <p className="inline-flex items-center gap-1 rounded-full bg-brand-cream px-3 py-1 text-xs font-semibold text-brand-primary">
                  <FolderOpen className="h-3.5 w-3.5" aria-hidden />
                  {item.slug}
                </p>
                <h3 className="mt-2 text-xl font-extrabold text-brand-primary">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/80">{item.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary/80">
                    <Images className="h-4 w-4" aria-hidden />
                    공개 앨범 {item.publicAlbumCount}개
                  </p>
                  <Link
                    href={`/gallery/${item.slug}`}
                    className="rounded-lg border border-brand-primary/15 px-3 py-1.5 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"
                  >
                    폴더 열기
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
