import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Vocab App - 英语背单词",
  description: "查词、复习、记忆 - 你的英语学习助手",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  themeColor: "#3b82f6",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vocab App",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
          {/* Main Content */}
          <main className="max-w-md mx-auto min-h-screen pb-24 px-4">
            {children}
          </main>

          {/* Bottom Navigation */}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
