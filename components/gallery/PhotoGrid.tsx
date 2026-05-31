"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { AdaptiveImage } from "@/components/AdaptiveImage";
import { PROGRAM_FALLBACK_GRADIENTS } from "@/lib/siteConfig";
import type { GalleryPhotoRecord, ProgramSlug } from "@/lib/gallery/types";
import type { ProgramIconKey } from "@/lib/types";

interface PhotoGridProps {
  photos: GalleryPhotoRecord[];
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
    return "촬영일 미정";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(parsed);
}

export function PhotoGrid({ photos }: PhotoGridProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedPhoto = useMemo(
    () => photos.find((photo) => photo.id === selectedId) ?? null,
    [photos, selectedId],
  );

  if (photos.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-brand-primary/20 bg-white p-6 text-sm text-foreground/80">
        공개된 사진이 없습니다.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setSelectedId(photo.id)}
            className="overflow-hidden rounded-2xl border border-brand-primary/10 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <AdaptiveImage
              src={photo.imageUrl}
              alt={photo.title || "갤러리 사진"}
              iconKey={iconMap[photo.programSlug]}
              fallbackGradient={PROGRAM_FALLBACK_GRADIENTS[iconMap[photo.programSlug]]}
              className="aspect-[4/3]"
              imageClassName="object-cover"
              fallbackLabel={photo.title || "갤러리 사진"}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="p-3">
              <h3 className="line-clamp-1 text-sm font-bold text-brand-primary">
                {photo.title || "제목 없음"}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs text-foreground/75">
                {photo.description || "설명이 없습니다."}
              </p>
              <p className="mt-2 text-xs font-semibold text-brand-primary/75">
                촬영일: {formatDate(photo.takenAt)}
              </p>
            </div>
          </button>
        ))}
      </div>

      {selectedPhoto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white">
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="absolute right-3 top-3 z-10 inline-flex rounded-full bg-black/70 p-1.5 text-white hover:bg-black"
              aria-label="닫기"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
            <AdaptiveImage
              src={selectedPhoto.imageUrl}
              alt={selectedPhoto.title || "갤러리 사진"}
              iconKey={iconMap[selectedPhoto.programSlug]}
              fallbackGradient={PROGRAM_FALLBACK_GRADIENTS[iconMap[selectedPhoto.programSlug]]}
              className="aspect-[16/10] bg-black"
              imageClassName="object-contain"
              fallbackLabel={selectedPhoto.title || "갤러리 사진"}
              sizes="100vw"
            />
            <div className="p-4">
              <h3 className="text-lg font-extrabold text-brand-primary">
                {selectedPhoto.title || "제목 없음"}
              </h3>
              <p className="mt-2 text-sm text-foreground/80">
                {selectedPhoto.description || "설명이 없습니다."}
              </p>
              <p className="mt-2 text-xs font-semibold text-brand-primary/75">
                촬영일: {formatDate(selectedPhoto.takenAt)}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
