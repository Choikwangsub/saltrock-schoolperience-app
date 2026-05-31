import Link from "next/link";
import { CalendarDays, ImageIcon, MapPin } from "lucide-react";
import { AdaptiveImage } from "@/components/AdaptiveImage";
import { SectionTitle } from "@/components/SectionTitle";
import type { GalleryAlbumRecord, ProgramSlug } from "@/lib/gallery/types";
import { PROGRAM_FALLBACK_GRADIENTS } from "@/lib/siteConfig";
import type { ProgramIconKey } from "@/lib/types";

interface AlbumGridProps {
  programSlug: ProgramSlug;
  programTitle: string;
  albums: GalleryAlbumRecord[];
}

const iconMap: Record<ProgramSlug, ProgramIconKey> = {
  "laser-survival": "laser-survival",
  "sky-swing": "sky-swing",
  "sports-climbing": "sports-climbing",
  "sports-day": "sports-day",
  "ai-homepage": "ai-homepage",
  "ai-diary": "ai-diary",
};

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

export function AlbumGrid({ programSlug, programTitle, albums }: AlbumGridProps) {
  const iconKey = iconMap[programSlug];

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Program Gallery"
          title={`${programTitle} 앨범`}
          description="행사 날짜 최신순으로 앨범을 확인할 수 있습니다."
          align="left"
        />

        {albums.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-brand-primary/20 bg-white p-6 text-sm text-foreground/80">
            공개된 앨범이 아직 없습니다. 준비가 완료되면 이곳에 사진 앨범이 표시됩니다.
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((album) => (
              <article
                key={album.id}
                className="overflow-hidden rounded-3xl border border-brand-primary/10 bg-white p-2 shadow-soft"
              >
                <AdaptiveImage
                  src={album.coverImageUrl ?? undefined}
                  alt={`${album.title} 대표 이미지`}
                  iconKey={iconKey}
                  fallbackGradient={PROGRAM_FALLBACK_GRADIENTS[iconKey]}
                  className="aspect-video rounded-2xl"
                  imageClassName="object-cover"
                  fallbackLabel={album.title}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="p-4">
                  <h3 className="text-lg font-extrabold text-brand-primary">{album.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-foreground/80">
                    {album.description || "행사 설명이 등록되지 않았습니다."}
                  </p>
                  <div className="mt-3 space-y-1 text-xs font-semibold text-brand-primary/80">
                    <p className="inline-flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" aria-hidden />
                      {formatDate(album.eventDate)}
                    </p>
                    <p className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4" aria-hidden />
                      {album.location || "장소 미정"}
                    </p>
                    <p className="inline-flex items-center gap-1">
                      <ImageIcon className="h-4 w-4" aria-hidden />
                      사진 {album.photoCount}장
                    </p>
                  </div>
                  <Link
                    href={`/gallery/${programSlug}/${album.id}`}
                    className="mt-4 inline-flex rounded-lg border border-brand-primary/15 px-3 py-1.5 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"
                  >
                    앨범 보기
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
