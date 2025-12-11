import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ServiceWorkerRegister } from "@/components/service-worker-register";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyDay: My Daily tasks",
  description:
    "A local-first task manager with daily recurrence, offline support, and a completion chart.",
  manifest: "/manifest.webmanifest",
  themeColor: "#000000",
  applicationName: "MyDay",
  icons: [
    { rel: "icon", url: "/icon.svg" },
    { rel: "apple-touch-icon", url: "/icon-192.png" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased select-none`}
      >
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
