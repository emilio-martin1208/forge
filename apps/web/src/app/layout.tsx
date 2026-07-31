import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import { forgeApi } from "@/lib/api";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Forge — by Shinobi Tools",
  description: "Forge transforms a software idea into a complete engineering plan and stays synchronized with your GitHub repository.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [projects, ideas, me] = await Promise.all([
    forgeApi.listProjects().catch(() => []),
    forgeApi.listIdeas().catch(() => []),
    forgeApi.getMe().catch(() => null),
  ]);

  return (
    <html lang="en" className={`${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <div className="flex min-h-screen">
          <Sidebar projects={projects} ideas={ideas} me={me} />
          <div className="flex-1 flex flex-col min-w-0">{children}</div>
        </div>
      </body>
    </html>
  );
}
