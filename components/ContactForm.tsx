"use client";

import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { submitInquiry } from "@/lib/inquiry";
import type { Program } from "@/lib/types";

interface ContactFormProps {
  programs: Program[];
}

interface InquiryFormState {
  name: string;
  phone: string;
  email: string;
  organizationName: string;
  programInterest: string;
  preferredDate: string;
  expectedStudents: string;
  message: string;
}

const initialState: InquiryFormState = {
  name: "",
  phone: "",
  email: "",
  organizationName: "",
  programInterest: "",
  preferredDate: "",
  expectedStudents: "",
  message: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm({ programs }: ContactFormProps) {
  const [formData, setFormData] = useState<InquiryFormState>(initialState);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const programOptions = useMemo(
    () => programs.map((program) => program.title),
    [programs],
  );

  const updateField = (key: keyof InquiryFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const requiredFields: Array<{ key: keyof InquiryFormState; label: string }> = [
      { key: "name", label: "이름" },
      { key: "phone", label: "연락처" },
      { key: "organizationName", label: "학교/기관명" },
      { key: "programInterest", label: "관심 프로그램" },
      { key: "message", label: "문의 내용" },
    ];

    const missing = requiredFields
      .filter(({ key }) => !formData[key].trim())
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
      const result = await submitInquiry({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        organizationName: formData.organizationName.trim(),
        programInterest: formData.programInterest.trim(),
        preferredDate: formData.preferredDate.trim() || undefined,
        expectedStudents: formData.expectedStudents.trim() || undefined,
        message: formData.message.trim(),
      });

      if (!result.ok) {
        setErrorMessage(result.message);
        return;
      }

      setSuccessMessage(result.message);
      setFormData(initialState);
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
        문의 내용은 안전하게 접수되며, 담당자가 확인 후 연락드립니다.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold text-foreground/85">
          이름 *
          <input
            value={formData.name}
            onChange={(event) => updateField("name", event.target.value)}
            className="mt-1 w-full rounded-xl border border-brand-primary/15 px-3 py-3 text-sm outline-none ring-brand-secondary focus:ring-2"
            placeholder="예: 홍길동"
          />
        </label>

        <label className="text-sm font-semibold text-foreground/85">
          연락처 *
          <input
            value={formData.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            className="mt-1 w-full rounded-xl border border-brand-primary/15 px-3 py-3 text-sm outline-none ring-brand-secondary focus:ring-2"
            placeholder="예: 010-0000-0000"
          />
        </label>

        <label className="text-sm font-semibold text-foreground/85">
          이메일
          <input
            type="email"
            value={formData.email}
            onChange={(event) => updateField("email", event.target.value)}
            className="mt-1 w-full rounded-xl border border-brand-primary/15 px-3 py-3 text-sm outline-none ring-brand-secondary focus:ring-2"
            placeholder="예: contact@saltrock-schoolperience.com"
          />
        </label>

        <label className="text-sm font-semibold text-foreground/85">
          학교/기관명 *
          <input
            value={formData.organizationName}
            onChange={(event) => updateField("organizationName", event.target.value)}
            className="mt-1 w-full rounded-xl border border-brand-primary/15 px-3 py-3 text-sm outline-none ring-brand-secondary focus:ring-2"
            placeholder="예: 솔트락초등학교"
          />
        </label>

        <label className="text-sm font-semibold text-foreground/85">
          관심 프로그램 *
          <select
            value={formData.programInterest}
            onChange={(event) => updateField("programInterest", event.target.value)}
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
            onChange={(event) => updateField("preferredDate", event.target.value)}
            className="mt-1 w-full rounded-xl border border-brand-primary/15 px-3 py-3 text-sm outline-none ring-brand-secondary focus:ring-2"
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-semibold text-foreground/85">
        예상 인원
        <input
          value={formData.expectedStudents}
          onChange={(event) => updateField("expectedStudents", event.target.value)}
          className="mt-1 w-full rounded-xl border border-brand-primary/15 px-3 py-3 text-sm outline-none ring-brand-secondary focus:ring-2"
          placeholder="예: 80명"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-foreground/85">
        문의 내용 *
        <textarea
          value={formData.message}
          onChange={(event) => updateField("message", event.target.value)}
          className="mt-1 min-h-28 w-full rounded-xl border border-brand-primary/15 px-3 py-3 text-sm outline-none ring-brand-secondary focus:ring-2"
          placeholder="운영 일정, 장소, 요청사항 등을 작성해 주세요."
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
      </button>
    </form>
  );
}
