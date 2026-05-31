"use client";

import { Mail, MessageCircle, MessageSquare, Phone } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { SectionTitle } from "@/components/SectionTitle";
import type { Program } from "@/lib/types";

interface ContactSectionProps {
  programs: Program[];
}

const inquiryChannels = [
  {
    key: "email",
    title: "이메일 문의",
    description: "상담 내용을 자세히 전달하고 싶은 경우",
    actionLabel: "contact@saltrock-schoolperience.com",
    href: "mailto:contact@saltrock-schoolperience.com",
    icon: Mail,
    colorClass: "from-[#12366f] to-[#2f63af]",
  },
  {
    key: "phone",
    title: "전화 문의",
    description: "운영 일정과 기본 견적을 빠르게 확인",
    actionLabel: "010-0000-0000",
    href: "tel:01000000000",
    icon: Phone,
    colorClass: "from-[#2b8ac5] to-[#68b9f2]",
  },
  {
    key: "sms",
    title: "문자 문의",
    description: "간단한 요청사항과 연락처 전달",
    actionLabel: "010-0000-0000",
    href: "sms:01000000000",
    icon: MessageSquare,
    colorClass: "from-[#43a36f] to-[#7fd0a1]",
  },
];

export function ContactSection({ programs }: ContactSectionProps) {
  const pendingMessage =
    "채널 준비중입니다. 이메일 또는 전화 문의를 이용해 주세요.";

  return (
    <section
      id="contact"
      className="border-t border-brand-primary/10 bg-[linear-gradient(180deg,#faf8f0_0%,#f7f6ef_100%)] py-16 md:py-20"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Contact"
          title="학교 일정에 맞춘 체험학습 상담"
          description="운영 형태와 인원에 따라 맞춤형으로 안내해 드립니다. 문의 채널 또는 폼 중 편한 방법으로 남겨 주세요."
          align="left"
        />

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          <div className="space-y-4 lg:col-span-5">
            {inquiryChannels.map((channel) => {
              const Icon = channel.icon;
              return (
                <a
                  key={channel.key}
                  href={channel.href}
                  className="group block rounded-2xl border border-brand-primary/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(18,54,111,0.16)]"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`inline-flex rounded-xl bg-gradient-to-br p-2.5 text-white ${channel.colorClass}`}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="flex-1">
                      <span className="block text-lg font-bold text-brand-primary">
                        {channel.title}
                      </span>
                      <span className="mt-1 block text-sm text-foreground/80">
                        {channel.description}
                      </span>
                      <span className="mt-2 block text-sm font-semibold text-brand-primary">
                        {channel.actionLabel}
                      </span>
                    </span>
                  </div>
                </a>
              );
            })}

            <button
              type="button"
              onClick={() => window.alert(pendingMessage)}
              className="group w-full rounded-2xl border border-brand-primary/10 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(18,54,111,0.16)]"
            >
              <div className="flex items-start gap-3">
                <span className="inline-flex rounded-xl bg-gradient-to-br from-[#f5c84f] to-[#efab3b] p-2.5 text-brand-primary">
                  <MessageCircle className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="block text-lg font-bold text-brand-primary">카카오톡 문의</span>
                  <span className="mt-1 block text-sm text-foreground/80">
                    카카오톡 채널 링크 준비중
                  </span>
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => window.alert(pendingMessage)}
              className="group w-full rounded-2xl border border-brand-primary/10 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(18,54,111,0.16)]"
            >
              <div className="flex items-start gap-3">
                <span className="inline-flex rounded-xl bg-gradient-to-br from-[#44b0d8] to-[#2f81ba] p-2.5 text-white">
                  <MessageCircle className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="block text-lg font-bold text-brand-primary">WhatsApp 문의</span>
                  <span className="mt-1 block text-sm text-foreground/80">
                    WhatsApp 문의 링크 준비중
                  </span>
                </span>
              </div>
            </button>
          </div>

          <div className="lg:col-span-7">
            <ContactForm programs={programs} />
          </div>
        </div>
      </div>
    </section>
  );
}
