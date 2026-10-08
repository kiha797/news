import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "약업 뉴스 데스크 | PHARMA DESK",
  description: "약업신문, 메디파나뉴스, 약사공론의 메인 뉴스 TOP 10을 한눈에.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
