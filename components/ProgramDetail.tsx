import Link from "next/link";
import {
  ArrowLeft,
  Clock3,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AdaptiveImage } from "@/components/AdaptiveImage";
import { Badge } from "@/components/Badge";
import { programIconMap } from "@/lib/programIcons";
import type { Program } from "@/lib/types";

interface ProgramDetailProps {
  program: Program;
  otherPrograms: Program[];
}

export function ProgramDetail({ program, otherPrograms }: ProgramDetailProps) {
  const Icon = programIconMap[program.icon];
  const isAiDiary = program.slug === "ai-diary";

  return (
    <article className="py-10 md:py-14">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-brand-primary/20 bg-white px-3 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-cream"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            메인으로 돌아가기
          </Link>
          <Link
            href="/#programs"
            className="inline-flex items-center gap-2 rounded-lg border border-brand-primary/20 bg-white px-3 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-cream"
          >
            다른 프로그램 보기
          </Link>
        </div>

        <div className="mt-5 overflow-hidden rounded-[2rem] border border-brand-primary/12 bg-white shadow-soft">
          <div className="relative">
            <AdaptiveImage
              src={program.imageUrl}
              alt={program.imageAlt}
              iconKey={program.icon}
              fallbackGradient={program.fallbackGradient}
              className="aspect-[16/7]"
              priority
              imageClassName="object-cover"
              fallbackLabel={`${program.title} 대표 이미지`}
              sizes="(max-width: 1200px) 100vw, 1200px"
            />
            <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand-primary">
              대표 이미지 영역
            </div>
            <div className="absolute bottom-5 right-5 rounded-2xl bg-white/85 p-3 text-brand-primary">
              <Icon className="h-8 w-8" aria-hidden />
            </div>
          </div>

          <div className="p-6 md:p-8">
            <h1 className="font-heading text-3xl font-black text-brand-primary md:text-4xl">
              {program.title}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-foreground/85">
              {program.shortDescription}
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 rounded-2xl bg-brand-cream p-4 md:grid-cols-2">
              <div className="rounded-xl bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-secondary">
                  추천 대상
                </p>
                <p className="mt-1 text-sm font-semibold text-brand-primary">
                  {program.targetAudience}
                </p>
              </div>
              <div className="rounded-xl bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-secondary">
                  운영 가능 학년
                </p>
                <p className="mt-1 text-sm font-semibold text-brand-primary">
                  {program.targetGrades.join(", ")}
                </p>
              </div>
              <div className="rounded-xl bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-secondary">
                  운영 시간
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-primary">
                  <Clock3 className="h-4 w-4" aria-hidden />
                  {program.duration}
                </p>
              </div>
              <div className="rounded-xl bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-secondary">
                  운영 장소
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-primary">
                  <MapPin className="h-4 w-4" aria-hidden />
                  {program.locationType}
                </p>
              </div>
            </div>

            <section className="mt-8">
              <h2 className="text-lg font-extrabold text-brand-primary">프로그램 소개</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/85 md:text-base">
                {program.description}
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-lg font-extrabold text-brand-primary">프로그램 특징 태그</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {program.tags.map((tag) => (
                  <Badge key={`${program.slug}-${tag}`} label={tag} />
                ))}
              </div>
            </section>

            <section className="mt-8">
              <h2 className="text-lg font-extrabold text-brand-primary">이런 학교/기관에 추천</h2>
              <ul className="mt-3 space-y-2 rounded-2xl border border-brand-primary/12 bg-brand-cream p-4">
                {program.recommendedFor.map((item) => (
                  <li key={item} className="text-sm leading-relaxed text-foreground/90">
                    • {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-lg font-extrabold text-brand-primary">진행 순서</h2>
              <ol className="mt-3 space-y-2 rounded-2xl border border-brand-primary/12 bg-white p-4">
                {program.processSteps.map((step, index) => (
                  <li key={step} className="text-sm leading-relaxed text-foreground/90">
                    <span className="mr-2 font-bold text-brand-primary">{index + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </section>

            <section className="mt-8">
              <h2 className="text-lg font-extrabold text-brand-primary">준비물 또는 필요 환경</h2>
              <ul className="mt-3 space-y-2 rounded-2xl border border-brand-primary/12 bg-white p-4">
                {program.requirements.map((item) => (
                  <li key={item} className="text-sm leading-relaxed text-foreground/90">
                    • {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="inline-flex items-center gap-2 text-lg font-extrabold text-brand-primary">
                <ShieldCheck className="h-5 w-5" aria-hidden />
                안전/운영 안내
              </h2>
              <ul className="mt-3 space-y-2 rounded-2xl border border-brand-primary/12 bg-brand-cream p-4">
                {program.safetyNotes.map((note) => (
                  <li key={note} className="text-sm leading-relaxed text-foreground/90">
                    • {note}
                  </li>
                ))}
              </ul>
            </section>

            {isAiDiary ? (
              <section className="mt-8 rounded-2xl border border-brand-secondary/35 bg-sky-50 p-4">
                <h2 className="inline-flex items-center gap-2 text-lg font-extrabold text-brand-primary">
                  <Sparkles className="h-5 w-5" aria-hidden />
                  AI 그림일기 운영 포인트
                </h2>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-foreground/90">
                  <li>• 1~2교시 기본 체험형, 4교시 완성형 과정으로 운영할 수 있습니다.</li>
                  <li>• 강사 계정 또는 운영 계정을 활용해 이미지 생성 수업이 가능합니다.</li>
                  <li>• 결과물 정리 및 프린트 제공 방식으로 확장 운영이 가능합니다.</li>
                  <li>• 학생 개인 계정이 없어도 수업 설계가 가능합니다.</li>
                  <li>
                    • 실명, 전화번호, 주소, 실제 얼굴 사진 등 민감정보를 사용하지 않도록
                    지도합니다.
                  </li>
                </ul>
              </section>
            ) : null}

            <section className="mt-8">
              <h2 className="text-lg font-extrabold text-brand-primary">기대 효과</h2>
              <ul className="mt-3 space-y-2 rounded-2xl border border-brand-primary/12 bg-white p-4">
                {program.expectedEffects.map((effect) => (
                  <li key={effect} className="text-sm leading-relaxed text-foreground/90">
                    • {effect}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-8 rounded-2xl border border-brand-primary/12 bg-white p-4">
              <p className="text-sm font-semibold text-brand-primary">{program.priceNote}</p>
              <p className="mt-1 text-sm text-foreground/75">
                내부 기준 단가(참고): 1인 {program.basePrice.toLocaleString("ko-KR")}원
              </p>
            </section>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/#contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary/90"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                문의하기
              </Link>
              <Link
                href="/#programs"
                className="inline-flex items-center justify-center rounded-xl border border-brand-primary/20 px-5 py-3 text-sm font-semibold text-brand-primary hover:bg-brand-cream"
              >
                다른 프로그램 보기
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl border border-brand-primary/20 px-5 py-3 text-sm font-semibold text-brand-primary hover:bg-brand-cream"
              >
                메인으로 돌아가기
              </Link>
            </div>
          </div>
        </div>

        <section className="mt-8 rounded-3xl border border-brand-primary/10 bg-white p-5 shadow-soft md:p-6">
          <h2 className="text-lg font-extrabold text-brand-primary">다른 프로그램도 함께 살펴보세요</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {otherPrograms.map((item) => (
              <Link
                key={`other-${item.slug}`}
                href={`/programs/${item.slug}`}
                className="rounded-xl border border-brand-primary/10 bg-brand-cream px-4 py-3 transition hover:border-brand-secondary/45 hover:bg-white"
              >
                <p className="text-sm font-bold text-brand-primary">{item.title}</p>
                <p className="mt-1 text-xs text-foreground/75">{item.shortDescription}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}
