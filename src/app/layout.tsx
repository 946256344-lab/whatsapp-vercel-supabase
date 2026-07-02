import "./styles.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WhatsApp 客户数据后台",
  description: "WhatsApp Cloud API webhook receiver with Supabase storage",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
