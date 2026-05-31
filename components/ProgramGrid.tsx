import { ProgramCard } from "@/components/ProgramCard";
import { SectionTitle } from "@/components/SectionTitle";
import type { Program } from "@/lib/types";

interface ProgramGridProps {
  programs: Program[];
}

export function ProgramGrid({ programs }: ProgramGridProps) {
  return (
    <section id="programs" className="py-16 md:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Our Program"
          title="체험 프로그램 안내"
          description="다양한 체험 프로그램으로 즐거운 학교생활을 만들어 보세요."
        />
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      </div>
    </section>
  );
}
