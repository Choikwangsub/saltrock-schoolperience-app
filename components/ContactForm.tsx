"use client";

import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { submitInquiry } from "@/lib/inquiry";
import type { Inquiry, Program } from "@/lib/types";

interface ContactFormProps {
  programs: Program[];
}

const initialInquiry: Inquiry = {
  schoolName: "",
  managerName: "",
  phone: "",
  email: "",
  selectedProgram: "",
  preferredDate: "",
  expectedStudents: "",
  targetGrade: "",
  location: "",
  message: "",
  status: "draft",
};

const requiredFields: Array<{ key: keyof Inquiry; label: string }> = [
  { key: "schoolName", label: "학교/기관명" },
  { key: "managerName", label: "담당자명" },
  { key: "phone", label: "연락처" },
  { key: "selectedProgram", label: "희망 프로그램" },
  { key: "message", label: "문의 내용" },
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm({ programs }: ContactFormProps) {
  const [formData, setFormData] = useState<Inquiry>(initialInquiry);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const programOptions = useMemo(
    () => programs.map((program) => program.title),
    [programs],
  );

  const handleChange = (key: keyof Inquiry, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const missing = requiredFields
      .filter(({ key }) => !String(formData[key] ?? "").trim())
      .map(({ label }) => label);

    if (missing.length > 0) {
      setErrorMessage(`필수 항목을 입력해 주세요: ${missing.join(", ")}`);
      return;
    }

    if (formData.email && !emailPattern.test(formData.email)) {
      setErrorMessage("이메일 형식을 확인해 주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Inquiry = { ...formData, status: "submitted" };
      const result = await submitInquiry(payload);
      if (!result.ok) {
        setErrorMessage("문의 접수 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }

      setSuccessMessage(result.message);
      setFormData(initialInquiry);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-brand-primary/12 bg-white p-5 shadow-soft md:p-6"
    >
      <h3 className="font-heading text-2xl font-extrabold text-brand-primary">문의 폼</h3>
      <p className="mt-2 text-sm text-foreground/80">
        입력하신 내용은 현재 로컬 테스트 단계에서 콘솔 출력으로만 처리됩니다.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold text-foreground/85">
          학교/기관명 *
          <input
            value={formData.schoolName}
            onChange={(event) => handleChange("schoolName", event.target.value)}
            className="mt-1 w-full rounded-xl border border-brand-primary/15 px-3 py-3 text-sm outline-none ring-brand-secondary focus:ring-2"
            placeholder="예: 솔트락초등학교"
          />
        </label>

        <label className="text-sm font-semibold text-foreground/85">
          담당자명 *
          <input
            value={formData.managerName}
            onChange={(event) => handleChange("managerName", event.target.value)}
            className="mt-1 w-full rounded-xl border border-brand-primary/15 px-3 py-3 text-sm outline-none ring-brand-secondary focus:ring-2"
            placeholder="예: 홍길동"
          />
        </label>

        <label className="text-sm font-semibold text-foreground/85">
          연락처 *
          <input
            value={formData.phone}
            onChange={(event) => handleChange("phone", event.target.value)}
            className="mt-1 w-full rounded-xl border border-brand-primary/15 px-3 py-3 text-sm outline-none ring-brand-secondary focus:ring-2"
            placeholder="예: 010-0000-0000"
          />
        </label>

        <label className="text-sm font-semibold text-foreground/85">
          이메일 (선택)
          <input
            type="email"
            value={formData.email}
            onChange={(event) => handleChange("email", event.target.value)}
            className="mt-1 w-full rounded-xl border border-brand-primary/15 px-3 py-3 text-sm outline-none ring-brand-secondary focus:ring-2"
            placeholder="예: contact@saltrock-schoolperience.com"
          />
        </label>

        <label className="text-sm font-semibold text-foreground/85">
          희망 프로그램 *
          <select
            value={formData.selectedProgram}
            onChange={(event) => handleChange("selectedProgram", event.target.value)}
            className="mt-1 w-full rounded-xl border border-brand-primary/15 px-3 py-3 text-sm outline-none ring-brand-secondary focus:ring-2"
          >
            <option value="">프로그램을 선택해 주세요</option>
            {programOptions.map((programName) => (
              <option key={programName} value={programName}>
                {programName}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold text-foreground/85">
          희망 날짜
          <input
            type="date"
            value={formData.preferredDate}
            onChange={(event) => handleChange("preferredDate", event.target.value)}
            className="mt-1 w-full rounded-xl border border-brand-primary/15 px-3 py-3 text-sm outline-none ring-brand-secondary focus:ring-2"
          />
        </label>

        <label className="text-sm font-semibold text-foreground/85">
          예상 인원
          <input
            value={formData.expectedStudents}
            onChange={(event) => handleChange("expectedStudents", event.target.value)}
            className="mt-1 w-full rounded-xl border border-brand-primary/15 px-3 py-3 text-sm outline-none ring-brand-secondary focus:ring-2"
            placeholder="예: 90명"
          />
        </label>

        <label className="text-sm font-semibold text-foreground/85">
          대상 학년
          <input
            value={formData.targetGrade}
            onChange={(event) => handleChange("targetGrade", event.target.value)}
            className="mt-1 w-full rounded-xl border border-brand-primary/15 px-3 py-3 text-sm outline-none ring-brand-secondary focus:ring-2"
            placeholder="예: 초등 4~6학년"
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-semibold text-foreground/85">
        운영 장소
        <input
          value={formData.location}
          onChange={(event) => handleChange("location", event.target.value)}
          className="mt-1 w-full rounded-xl border border-brand-primary/15 px-3 py-3 text-sm outline-none ring-brand-secondary focus:ring-2"
          placeholder="예: 솔트락초등학교 강당"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-foreground/85">
        문의 내용 *
        <textarea
          value={formData.message}
          onChange={(event) => handleChange("message", event.target.value)}
          className="mt-1 min-h-28 w-full rounded-xl border border-brand-primary/15 px-3 py-3 text-sm outline-none ring-brand-secondary focus:ring-2"
          placeholder="희망 일정, 운영 시간, 요청 사항 등을 작성해 주세요."
        />
      </label>

      {errorMessage ? (
        <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          {successMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-primary to-[#1f4f99] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:from-brand-primary/40 disabled:to-brand-primary/40 md:w-auto"
      >
        <Send className="h-4 w-4" aria-hidden />
        {isSubmitting ? "접수 중..." : "문의 접수하기"}
        {!isSubmitting ? (
          <span className="ml-1 inline-flex items-center rounded-full bg-brand-accent px-2 py-0.5 text-[11px] font-bold text-brand-primary">
            빠른 상담
          </span>
        ) : null}
      </button>
    </form>
  );
}
