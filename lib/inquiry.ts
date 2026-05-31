export interface InquirySubmitInput {
  name: string;
  phone: string;
  email?: string;
  organizationName: string;
  programInterest: string;
  preferredDate?: string;
  expectedStudents?: string;
  message: string;
}

export async function submitInquiry(data: InquirySubmitInput): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    const response = await fetch("/api/inquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = (await response.json()) as { ok?: boolean; message?: string };
    if (!response.ok || !result.ok) {
      return {
        ok: false,
        message: result.message ?? "문의 접수 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      };
    }

    return {
      ok: true,
      message:
        result.message ?? "문의가 접수되었습니다. 담당자가 확인 후 연락드리겠습니다.",
    };
  } catch {
    return {
      ok: false,
      message: "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }
}
