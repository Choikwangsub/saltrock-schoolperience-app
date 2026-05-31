import "server-only";

interface InquiryAdminNotifyInput {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  organizationName: string;
  programValue: string;
  preferredDate: string | null;
  expectedStudents: string | null;
  message: string;
  createdAt?: string;
}

interface NotifyResult {
  ok: boolean;
  skipped: boolean;
  message: string;
}

function buildTextBody(input: InquiryAdminNotifyInput) {
  return [
    "[SaltRock Schoolperience] 신규 문의 접수 알림",
    "",
    `문의 ID: ${input.id}`,
    `접수 시각: ${input.createdAt ?? new Date().toISOString()}`,
    `이름: ${input.name}`,
    `연락처: ${input.phone}`,
    `이메일: ${input.email || "-"}`,
    `학교/기관명: ${input.organizationName || "-"}`,
    `관심 프로그램: ${input.programValue || "-"}`,
    `희망 날짜: ${input.preferredDate || "-"}`,
    `예상 인원: ${input.expectedStudents || "-"}`,
    "",
    "[문의 내용]",
    input.message || "-",
  ].join("\n");
}

export async function sendInquiryAdminNotificationEmail(
  input: InquiryAdminNotifyInput,
): Promise<NotifyResult> {
  const notifyEmail = process.env.ADMIN_NOTIFY_EMAIL?.trim();
  if (!notifyEmail) {
    return {
      ok: false,
      skipped: true,
      message: "ADMIN_NOTIFY_EMAIL이 설정되지 않아 관리자 이메일 알림을 건너뜁니다.",
    };
  }

  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (!resendApiKey) {
    return {
      ok: false,
      skipped: true,
      message:
        "RESEND_API_KEY가 없어 이메일 알림을 전송하지 못했습니다. 키를 설정하면 자동 발송됩니다.",
    };
  }

  const fromEmail = process.env.ADMIN_NOTIFY_FROM_EMAIL?.trim() || "onboarding@resend.dev";
  const subject = `[SaltRock 문의] ${input.name} / ${input.programValue || "프로그램 미지정"}`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [notifyEmail],
        subject,
        text: buildTextBody(input),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        ok: false,
        skipped: false,
        message: `관리자 이메일 전송 실패: ${errorText.slice(0, 500)}`,
      };
    }

    return {
      ok: true,
      skipped: false,
      message: "관리자 이메일 알림을 전송했습니다.",
    };
  } catch (error) {
    return {
      ok: false,
      skipped: false,
      message: error instanceof Error ? error.message : "관리자 이메일 전송 중 오류가 발생했습니다.",
    };
  }
}
