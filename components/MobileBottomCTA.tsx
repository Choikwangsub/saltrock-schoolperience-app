import Link from "next/link";
import { MessageCircle } from "lucide-react";

export function MobileBottomCTA() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-primary/10 bg-white/95 p-3 backdrop-blur md:hidden">
      <Link
        href="/#contact"
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-base font-semibold text-white shadow-soft"
      >
        <MessageCircle className="h-5 w-5" aria-hidden />
        문의하기
      </Link>
    </div>
  );
}
