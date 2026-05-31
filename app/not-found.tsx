import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-secondary">
        404
      </p>
      <h1 className="mt-3 font-heading text-3xl font-black text-brand-primary md:text-4xl">
        요청하신 페이지를 찾을 수 없습니다.
      </h1>
      <p className="mt-4 text-sm text-foreground/80 md:text-base">
        주소를 다시 확인해 주세요. 메인 화면에서 프로그램을 다시 선택할 수 있습니다.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white"
      >
        메인으로 이동
      </Link>
    </section>
  );
}
