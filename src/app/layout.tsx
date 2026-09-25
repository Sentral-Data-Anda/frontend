import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";

import { Providers } from "@/app/providers";
import { brand } from "@/config/brand";
import { siteConfig } from "@/config/site";
import { ServiceWorkerProvider } from "@/features/pwa";
import { publicEnv } from "@/lib/env";

import "./globals.css";

const roboto = Roboto({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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

export const viewport: Viewport = {
  // Tanpa `cover`, Safari iOS melaporkan env(safe-area-inset-*) sebagai 0.
  viewportFit: "cover",
  // Mencegah auto-zoom iOS pada input 12px.
  maximumScale: 1,
  themeColor: brand.themeColor.light,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${roboto.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ServiceWorkerProvider />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
