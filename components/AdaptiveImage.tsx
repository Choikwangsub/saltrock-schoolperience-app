"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { programIconMap } from "@/lib/programIcons";
import type { ProgramIconKey } from "@/lib/types";

interface AdaptiveImageProps {
  src?: string;
  alt: string;
  fallbackGradient: string;
  iconKey: ProgramIconKey;
  className?: string;
  sizes?: string;
  priority?: boolean;
  imageClassName?: string;
  fallbackLabel?: string;
}

export function AdaptiveImage({
  src,
  alt,
  fallbackGradient,
  iconKey,
  className = "",
  sizes = "100vw",
  priority = false,
  imageClassName = "",
  fallbackLabel,
}: AdaptiveImageProps) {
  const [failed, setFailed] = useState(false);
  const Icon = useMemo(() => programIconMap[iconKey], [iconKey]);
  const canRenderImage = Boolean(src) && !failed;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${fallbackGradient}`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_20%,rgba(255,255,255,0.4),transparent_44%)]" />

      {canRenderImage ? (
        <>
          <Image
            src={src ?? ""}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            className={`object-cover ${imageClassName}`}
            onError={() => setFailed(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-black/8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-brand-primary backdrop-blur-sm">
            <Icon className="h-4 w-4" aria-hidden />
            <span className="text-xs font-semibold">
              {fallbackLabel ?? "이미지 준비중"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
