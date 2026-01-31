import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smartfarm Web",
  description: "스마트팜 웹 서비스 — 센서 모니터링·액추에이터 제어",
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
