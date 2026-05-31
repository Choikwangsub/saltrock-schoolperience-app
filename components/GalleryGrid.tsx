import Link from "next/link";
import { AdaptiveImage } from "@/components/AdaptiveImage";
import { SectionTitle } from "@/components/SectionTitle";
import { PROGRAM_FALLBACK_GRADIENTS } from "@/lib/siteConfig";
import type { GalleryItem, ProgramIconKey } from "@/lib/types";

interface GalleryGridProps {
  items: GalleryItem[];
  previewCount?: number;
  showHeaderLink?: boolean;
}

const iconBySlug: Record<string, ProgramIconKey> = {
  "laser-survival": "laser-survival",
  "sky-swing": "sky-swing",
  "sports-climbing": "sports-climbing",
  "sports-day": "sports-day",
  "ai-homepage": "ai-homepage",
  "ai-diary": "ai-diary",
};

function resolveIconKey(slug: string): ProgramIconKey {
  return iconBySlug[slug] ?? "sports-day";
}

function resolveFallbackGradient(slug: string) {
  const iconKey = resolveIconKey(slug);
  return PROGRAM_FALLBACK_GRADIENTS[iconKey];
}

export function GalleryGrid({
  items,
  previewCount,
  showHeaderLink = false,
}: GalleryGridProps) {
  const renderedItems = previewCount ? items.slice(0, previewCount) : items;

  return (
    <section id="gallery" className="py-16 md:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <SectionTitle
            eyebrow="Gallery"
            title="현장 갤러리"
            description="현장 중심 체험학습의 분위기를 사진으로 먼저 확인해 보세요."
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
              key={item.id}
              className="overflow-hidden rounded-3xl border border-brand-primary/10 bg-white shadow-soft"
            >
              <AdaptiveImage
                src={item.imageUrl}
                alt={item.title}
                iconKey={resolveIconKey(item.slug)}
                fallbackGradient={resolveFallbackGradient(item.slug)}
                className="aspect-video"
                imageClassName="object-cover"
                fallbackLabel={item.title}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.13em] text-brand-secondary">
                  {item.category}
                </p>
                <h3 className="mt-1 text-lg font-extrabold text-brand-primary">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                  {item.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
