import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sarabun",
});

export const metadata: Metadata = {
  title: "ระบบตรวจประเมินภายใน | Internal Audit",
  description:
    "ระบบจัดการงานตรวจประเมินภายใน แผนตรวจ โครงสร้างสาขา แบบฟอร์ม และติดตามสถานะเอกสาร",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${sarabun.variable} h-full antialiased`}>
      <body className={`${sarabun.className} min-h-full`}>{children}</body>
    </html>
  );
}
