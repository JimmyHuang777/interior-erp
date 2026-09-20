import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "隱居設計 Interior Studio | 室內設計",
  description: "隱居設計提供住宅與商業空間設計、統包工程管理，從丈量到完工保固全程服務。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-Hant" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-slate-900">{children}</body>
    </html>
  );
}
