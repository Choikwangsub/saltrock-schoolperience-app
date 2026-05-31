import { CheckCircle2, Handshake, ShieldCheck, Sparkles, Users } from "lucide-react";
import { ContactSection } from "@/components/ContactSection";
import { GalleryGrid } from "@/components/GalleryGrid";
import { HeroSection } from "@/components/HeroSection";
import { ProgramGrid } from "@/components/ProgramGrid";
import { SectionTitle } from "@/components/SectionTitle";
import { getGalleryItems } from "@/lib/gallery";
import { getPrograms } from "@/lib/programs";

const platformPoints = [
  {
    title: "전문 강사진 운영",
    description: "풍부한 학교 현장 경험을 가진 강사진이 학생 눈높이에 맞춰 진행합니다.",
    icon: Users,
  },
  {
    title: "안전 최우선 운영",
    description: "사전 안내와 현장 동선 관리를 중심으로 안전한 운영을 준비합니다.",
    icon: ShieldCheck,
  },
  {
    title: "맞춤형 프로그램",
    description: "학년, 인원, 운영 환경을 고려해 학교별 맞춤형 흐름으로 구성합니다.",
    icon: Sparkles,
  },
  {
    title: "간편한 상담",
    description: "전화, 이메일, 문자, 문의 폼까지 다양한 채널로 빠르게 상담 가능합니다.",
    icon: Handshake,
  },
  {
    title: "높은 만족도",
    description: "학생 참여도를 높이고 교사 운영 부담은 줄이는 체험형 수업을 목표로 합니다.",
    icon: CheckCircle2,
  },
];

export default async function Home() {
  const programs = getPrograms();
  const galleryItems = await getGalleryItems();

  return (
    <>
      <HeroSection />
      <ProgramGrid programs={programs} />
      <GalleryGrid items={galleryItems} previewCount={6} showHeaderLink />
      <section id="why-saltrock" className="bg-white py-16 md:py-20">
        <div id="guide" />
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Why SaltRock"
            title="왜 우리 프로그램인가요?"
            description="학교 현장에 맞춘 운영 노하우로 안정적인 체험학습을 설계합니다."
            align="left"
          />
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {platformPoints.map((point) => {
              const Icon = point.icon;

              return (
                <article
                  key={point.title}
                  className="rounded-2xl border border-brand-primary/10 bg-brand-cream p-5 shadow-soft"
                >
                  <div className="mb-3 inline-flex rounded-xl bg-white p-2.5 text-brand-primary shadow-sm">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="text-base font-semibold text-brand-primary">{point.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                    {point.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <ContactSection programs={programs} />
    </>
  );
}
