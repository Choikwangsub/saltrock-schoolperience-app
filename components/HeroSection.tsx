import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  MessageCircle,
  ShieldCheck,
  ThumbsUp,
  Users,
} from "lucide-react";
import { ASSET_PATHS } from "@/lib/siteConfig";

const heroFeatures = [
  { icon: Users, label: "맞춤형 프로그램" },
  { icon: CalendarCheck, label: "간편한 일정 협의" },
  { icon: ThumbsUp, label: "전문 강사진" },
  { icon: ShieldCheck, label: "안전한 운영" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 py-11 sm:px-6 md:py-14 lg:grid-cols-12 lg:items-center lg:px-8">
        <div className="lg:col-span-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-secondary">
            학교로 찾아가는 특별한 체험 프로그램
          </p>
          <h1 className="mt-4 font-heading text-4xl font-black leading-tight text-brand-primary sm:text-5xl">
            즐거운 경험이
            <br />
            <span className="text-[#3fa56f]">성장의 힘</span>이 됩니다!
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-foreground/85 md:text-lg">
            SaltRock Schoolperience는 초등학교 3~6학년 중심의 활동형·창의형 체험학습을
            학교 일정에 맞춰 제공합니다. 사전 안내부터 현장 동선 관리까지 안정적인 운영
            흐름으로 준비합니다.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/#programs"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary/90"
            >
              프로그램 둘러보기
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/#contact"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-brand-primary/20 bg-white px-5 py-3 text-sm font-semibold text-brand-primary transition hover:bg-brand-cream"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              문의하기
            </Link>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {heroFeatures.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.label}
                  className="rounded-2xl border border-brand-primary/10 bg-brand-cream p-3 text-center shadow-sm"
                >
                  <Icon className="mx-auto h-5 w-5 text-brand-primary" aria-hidden />
                  <p className="mt-2 text-xs font-semibold text-foreground/85">{feature.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="hero-cloud relative fade-in-up lg:col-span-7">
          <div className="relative overflow-hidden rounded-[2rem] border border-brand-primary/10 bg-gradient-to-br from-[#c4e7ff] via-[#dff1ff] to-[#f8fbff] p-4 shadow-soft md:p-6">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-85"
              style={{ backgroundImage: `url(${ASSET_PATHS.hero})` }}
              aria-hidden
            />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(255,255,255,0.08))]" />
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-accent/40 blur-3xl" />
            <div className="absolute -left-10 bottom-0 h-44 w-44 rounded-full bg-brand-secondary/35 blur-3xl" />

            <div className="relative grid gap-3 sm:grid-cols-4">
              {["도전", "협동", "창의", "성장"].map((word) => (
                <div
                  key={word}
                  className="rounded-2xl border border-white/45 bg-white/40 px-4 py-3 text-center shadow-[0_10px_26px_rgba(18,54,111,0.12)] backdrop-blur-md"
                >
                  <p className="text-xs font-semibold text-brand-primary/75">학생 체험</p>
                  <p className="mt-1 font-heading text-xl font-black text-brand-primary">{word}</p>
                </div>
              ))}
            </div>

            <div className="relative mt-4 rounded-2xl border border-white/50 bg-white/65 p-4 text-sm leading-relaxed text-foreground/85 backdrop-blur-sm">
              학교 담당자와 기관 담당자가 빠르게 검토할 수 있도록 프로그램 구성, 운영 방식,
              문의 흐름을 한 화면에서 확인할 수 있게 준비했습니다.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
