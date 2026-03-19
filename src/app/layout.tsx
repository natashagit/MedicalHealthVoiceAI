import type { Metadata } from "next";
import "./globals.css";
import AnimatedBackground from "@/components/AnimatedBackground";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Kyron Medical | AI Healthcare Assistant",
  description: "Your AI-powered healthcare assistant. Schedule appointments, check prescriptions, and connect with your care team through intelligent voice AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <AnimatedBackground />
        <Header />
        <main className="flex-1 pt-[88px]">
          {children}
        </main>
      </body>
    </html>
  );
}
