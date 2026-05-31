import { programs } from "@/lib/mockData";
import type { Program } from "@/lib/types";

export function getPrograms(): Program[] {
  return programs
    .filter((program) => program.isPublished)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getProgramBySlug(slug: string): Program | undefined {
  return getPrograms().find((program) => program.slug === slug);
}
