import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "Echo AI",
  description: "Echo AI, and AI assistant created in Next.js using Vercel SDK, Groq and VAD",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="absolute top-0 z-[-2] h-screen w-screen bg-neutral-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        {children}
        <Toaster richColors theme="system" />
        <Analytics />
      </body>
    </html>
  );
}
