import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProgramDetail } from "@/components/ProgramDetail";
import { getProgramBySlug, getPrograms } from "@/lib/programs";

interface ProgramPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProgramPageProps): Promise<Metadata> {
  const { slug } = await params;
  const program = getProgramBySlug(slug);

  if (!program) {
    return {
      title: "프로그램을 찾을 수 없습니다 | SaltRock Schoolperience",
      description: "요청하신 프로그램 정보를 찾을 수 없습니다.",
    };
  }

  return {
    title: `${program.title} | SaltRock Schoolperience`,
    description: program.shortDescription,
    openGraph: {
      title: `${program.title} | SaltRock Schoolperience`,
      description: program.shortDescription,
      type: "article",
      locale: "ko_KR",
    },
  };
}

export async function generateStaticParams() {
  return getPrograms().map((program) => ({ slug: program.slug }));
}

export default async function ProgramPage({ params }: ProgramPageProps) {
  const { slug } = await params;
  const program = getProgramBySlug(slug);
  const otherPrograms = getPrograms().filter((item) => item.slug !== slug).slice(0, 4);

  if (!program) {
    notFound();
  }

  return <ProgramDetail program={program} otherPrograms={otherPrograms} />;
}
