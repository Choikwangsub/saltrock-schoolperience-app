"use client";

import Link from "next/link";
import { ChevronDown, Menu, MessageCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { programIconMap } from "@/lib/programIcons";
import { getPrograms } from "@/lib/programs";

const programs = getPrograms();

function toBrief(text: string) {
  return text.length > 52 ? `${text.slice(0, 52)}...` : text;
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProgramsOpen, setIsProgramsOpen] = useState(false);
  const [isMobileProgramsOpen, setIsMobileProgramsOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openProgramsDropdown = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setIsProgramsOpen(true);
  };

  const closeProgramsDropdownWithDelay = () => {
    closeTimer.current = setTimeout(() => {
      setIsProgramsOpen(false);
    }, 140);
  };

  useEffect(() => {
    return () => {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
      }
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-brand-primary/10 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0">
          <BrandLogo />
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-semibold text-brand-primary lg:flex">
          <div
            className="relative"
            onMouseEnter={openProgramsDropdown}
            onMouseLeave={closeProgramsDropdownWithDelay}
          >
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 hover:text-brand-secondary"
            >
              프로그램 소개
              <ChevronDown
                className={`h-4 w-4 transition ${
                  isProgramsOpen ? "rotate-180" : "rotate-0"
                }`}
                aria-hidden
              />
            </button>

            <div
              className={`absolute left-1/2 top-[calc(100%+10px)] w-[560px] -translate-x-1/2 rounded-2xl border border-brand-primary/10 bg-white p-3 shadow-soft transition ${
                isProgramsOpen
                  ? "visible translate-y-0 opacity-100"
                  : "invisible -translate-y-1 opacity-0"
              }`}
            >
              <div className="grid grid-cols-2 gap-2">
                {programs.map((program) => {
                  const Icon = programIconMap[program.icon];

                  return (
                    <Link
                      key={program.slug}
                      href={`/programs/${program.slug}`}
                      className="rounded-xl border border-brand-primary/8 p-3 transition hover:border-brand-secondary/40 hover:bg-brand-cream"
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 inline-flex rounded-lg bg-brand-primary/8 p-1.5 text-brand-primary">
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <span>
                          <span className="block text-sm font-bold text-brand-primary">
                            {program.title}
                          </span>
                          <span className="mt-1 block text-xs leading-relaxed text-foreground/75">
                            {toBrief(program.shortDescription)}
                          </span>
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <Link href="/#programs" className="hover:text-brand-secondary">
            프로그램 안내
          </Link>
          <Link href="/#why-saltrock" className="hover:text-brand-secondary">
            이용 안내
          </Link>
          <Link href="/#contact" className="hover:text-brand-secondary">
            문의하기
          </Link>
        </nav>

        <div className="hidden lg:block">
          <Link
            href="/#contact"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary/90"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            문의하기
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="inline-flex items-center justify-center rounded-xl p-2 text-brand-primary ring-1 ring-brand-primary/20 transition hover:bg-brand-cream lg:hidden"
          aria-label="모바일 메뉴"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isMenuOpen ? (
        <div className="border-t border-brand-primary/10 bg-white lg:hidden">
          <nav className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setIsMobileProgramsOpen((prev) => !prev)}
              className="inline-flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-brand-primary hover:bg-brand-cream"
            >
              프로그램 소개
              <ChevronDown
                className={`h-4 w-4 transition ${
                  isMobileProgramsOpen ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ${
                isMobileProgramsOpen ? "max-h-[600px] pb-2" : "max-h-0"
              }`}
            >
              <div className="space-y-1 rounded-lg bg-brand-cream/70 p-2">
                {programs.map((program) => {
                  const Icon = programIconMap[program.icon];

                  return (
                    <Link
                      key={`mobile-program-${program.slug}`}
                      href={`/programs/${program.slug}`}
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsMobileProgramsOpen(false);
                      }}
                      className="flex items-start gap-2 rounded-md px-2 py-2 text-xs font-medium text-brand-primary hover:bg-white"
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                      <span>
                        <span className="block text-sm font-semibold">{program.title}</span>
                        <span className="mt-0.5 block text-foreground/70">
                          {toBrief(program.shortDescription)}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <Link
              href="/#programs"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-brand-primary hover:bg-brand-cream"
            >
              프로그램 안내
            </Link>
            <Link
              href="/#why-saltrock"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-brand-primary hover:bg-brand-cream"
            >
              이용 안내
            </Link>
            <Link
              href="/#contact"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-brand-primary hover:bg-brand-cream"
            >
              문의하기
            </Link>

            <Link
              href="/#contact"
              onClick={() => setIsMenuOpen(false)}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-primary px-3 py-2.5 text-sm font-semibold text-white"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              문의하기
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
