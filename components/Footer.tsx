import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-brand-primary/10 bg-brand-primary text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="font-heading text-lg font-bold">SaltRock Schoolperience</p>
          <p className="text-sm text-white/80">솔트락 스쿨피리언스 | 찾아가는 체험학습 플랫폼</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-white/90">
          <Link href="/#programs" className="hover:text-brand-accent">
            프로그램
          </Link>
          <Link href="/gallery" className="hover:text-brand-accent">
            갤러리
          </Link>
          <Link href="/calendar" className="hover:text-brand-accent">
            운영 일정
          </Link>
          <Link href="/#contact" className="hover:text-brand-accent">
            문의하기
          </Link>
          <span className="text-white/70">© {year} SaltRock Schoolperience.</span>
        </div>
      </div>
    </footer>
  );
}
