import type { Inquiry } from "@/lib/types";

export async function submitInquiry(data: Inquiry): Promise<{
  ok: boolean;
  message: string;
}> {
  console.log("[MockInquiry] submitInquiry payload:", data);

  return {
    ok: true,
    message: "문의가 접수되었습니다. 담당자가 확인 후 연락드리겠습니다.",
  };
}
