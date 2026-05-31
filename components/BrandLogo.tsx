"use client";

import Image from "next/image";
import { useState } from "react";
import { BRAND_INFO, ASSET_PATHS } from "@/lib/siteConfig";

interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className = "" }: BrandLogoProps) {
  const [failed, setFailed] = useState(false);

  if (!failed) {
    return (
      <div className={`relative h-12 w-[212px] sm:h-14 sm:w-[250px] ${className}`}>
        <Image
          src={ASSET_PATHS.logo}
          alt={`${BRAND_INFO.name} 로고`}
          fill
          sizes="(max-width: 640px) 212px, 250px"
          className="object-contain object-left"
          onError={() => setFailed(true)}
          priority
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        aria-hidden
        className="shrink-0 rounded-xl border border-brand-primary/15 bg-white p-1 shadow-sm"
      >
        <defs>
          <linearGradient id="saltrockFallback" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#12366f" />
            <stop offset="100%" stopColor="#68b9f2" />
          </linearGradient>
        </defs>
        <path
          d="M8 30L15 20L22 26L28 16L36 30Z"
          fill="none"
          stroke="url(#saltrockFallback)"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M17 13L19 9L21 13L25 14L22 17L22.5 21L19 19L15.5 21L16 17L13 14Z"
          fill="#f6c44f"
          stroke="#12366f"
          strokeWidth="1.2"
        />
      </svg>
      <div className="leading-tight">
        <p className="font-heading text-base font-extrabold text-brand-primary sm:text-lg">
          {BRAND_INFO.name}
        </p>
        <p className="text-xs font-semibold text-foreground/75 sm:text-sm">
          {BRAND_INFO.nameKo} | {BRAND_INFO.tagline}
        </p>
      </div>
    </div>
  );
}
