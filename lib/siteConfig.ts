import type { ProgramIconKey } from "@/lib/types";

export const BRAND_INFO = {
  name: "SaltRock Schoolperience",
  nameKo: "솔트락 스쿨피리언스",
  tagline: "찾아가는 체험학습 플랫폼",
} as const;

export const ASSET_PATHS = {
  logo: "/brand/saltrock-schoolperience-logo.png",
  hero: "/hero/schoolperience-hero.png",
  programs: {
    "laser-survival": "/programs/laser-survival.jpg",
    "sky-swing": "/programs/sky-swing.jpg",
    "sports-climbing": "/programs/sports-climbing.jpg",
    "sports-day": "/programs/sports-day.jpg",
    "ai-homepage": "/programs/ai-homepage.jpg",
    "ai-diary": "/programs/ai-diary.jpg",
  },
} as const;

export const PROGRAM_FALLBACK_GRADIENTS: Record<ProgramIconKey, string> = {
  "laser-survival": "from-[#0f3d7a] via-[#1c67ad] to-[#6ec4f7]",
  "sky-swing": "from-[#1a8bc7] via-[#56b7e9] to-[#b3e5ff]",
  "sports-climbing": "from-[#ef9f3e] via-[#f3c069] to-[#ffe3b3]",
  "sports-day": "from-[#3fa56f] via-[#64c48f] to-[#c7f0da]",
  "ai-homepage": "from-[#5a4fd9] via-[#7889ff] to-[#c9d1ff]",
  "ai-diary": "from-[#db5a78] via-[#ed7f92] to-[#ffd6de]",
};
