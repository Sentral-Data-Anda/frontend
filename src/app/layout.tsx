import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { brand } from "@/config/brand";
import { siteConfig } from "@/config/site";
import { ErrorReporter } from "@/features/observability";
import { ServiceWorkerProvider } from "@/features/pwa";
import { publicEnv } from "@/lib/env";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL),
  title: {
    default: `${siteConfig.name} (${siteConfig.shortName})`,
    template: `%s · ${siteConfig.shortName}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: publicEnv.NEXT_PUBLIC_SITE_URL,
    siteName: siteConfig.name,
    locale: "id_ID",
    type: "website",
  },
};

/**
 * `theme_color` di manifest bersifat statis — satu nilai untuk selamanya.
 * Nilai itu mewarnai titlebar window standalone di desktop dan status bar di
 * Android, jadi tanpa varian di bawah, aplikasi dalam mode gelap tetap
 * mendapat titlebar terang. Media query di sini yang membuatnya mengikuti
 * tema; manifest tetap menyimpan warna terang sebagai fallback saat aplikasi
 * belum berjalan (splash screen).
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: brand.themeColor.light },
    { media: "(prefers-color-scheme: dark)", color: brand.themeColor.dark },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ErrorReporter />
        <ServiceWorkerProvider />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
