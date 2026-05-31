import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AdaptiveImage } from "@/components/AdaptiveImage";
import { Badge } from "@/components/Badge";
import { programIconMap } from "@/lib/programIcons";
import type { Program } from "@/lib/types";

interface ProgramCardProps {
  program: Program;
}

const buttonToneByIcon = {
  "laser-survival": "group-hover:bg-[#ef5858]",
  "sky-swing": "group-hover:bg-[#15a6d4]",
  "sports-climbing": "group-hover:bg-[#f59a22]",
  "sports-day": "group-hover:bg-[#4cae6a]",
  "ai-homepage": "group-hover:bg-[#4f6bff]",
  "ai-diary": "group-hover:bg-[#df5a84]",
} as const;

export function ProgramCard({ program }: ProgramCardProps) {
  const Icon = programIconMap[program.icon];

  return (
    <article className="group h-full">
      <Link
        href={`/programs/${program.slug}`}
        className="block h-full rounded-3xl border border-brand-primary/10 bg-white p-2 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(18,54,111,0.18)]"
      >
        <div className="relative overflow-hidden rounded-2xl">
          <AdaptiveImage
            src={program.imageUrl}
            alt={program.imageAlt}
            iconKey={program.icon}
            fallbackGradient={program.fallbackGradient}
            className="aspect-video"
            imageClassName="transition duration-500 group-hover:scale-[1.04]"
            fallbackLabel={program.title}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute left-3 top-3 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-brand-primary backdrop-blur-sm">
            {program.targetGrades[0]}
          </div>
        </div>

        <div className="px-4 pb-5 pt-4">
          <div className="mb-3 inline-flex rounded-2xl bg-brand-primary/8 p-2.5 text-brand-primary shadow-sm">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <h3 className="font-heading text-2xl font-extrabold text-brand-primary">
            {program.title}
          </h3>
          <p className="mt-3 min-h-16 text-sm leading-relaxed text-foreground/85">
            {program.shortDescription}
          </p>

          <div className="mt-3 text-xs font-semibold text-brand-primary/75">
            추천 대상: {program.targetAudience}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {program.tags.slice(0, 4).map((tag) => (
              <Badge key={`${program.slug}-${tag}`} label={tag} />
            ))}
          </div>

          <span
            className={`mt-5 inline-flex items-center gap-1 rounded-xl border border-brand-primary/15 px-4 py-2.5 text-sm font-semibold text-brand-primary transition ${buttonToneByIcon[program.icon]} group-hover:text-white`}
          >
            자세히 보기
            <ArrowRight className="h-4 w-4" aria-hidden />
          </span>
        </div>
      </Link>
    </article>
  );
}
