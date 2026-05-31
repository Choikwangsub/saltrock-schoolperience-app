import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileBottomCTA } from "@/components/MobileBottomCTA";
import "./globals.css";

const title = "SaltRock Schoolperience | 찾아가는 체험학습 플랫폼";
const description =
  "학교와 기관으로 직접 찾아가는 활동형·창의형 체험학습 프로그램";

export const metadata: Metadata = {
  title,
  description,
  manifest: "/manifest.webmanifest",
  openGraph: {
    title,
    description,
    siteName: "SaltRock Schoolperience",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full scroll-smooth">
      <body className="min-h-full bg-background text-foreground font-sans">
        <div className="relative flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
          <Footer />
          <MobileBottomCTA />
        </div>
      </body>
    </html>
  );
}
