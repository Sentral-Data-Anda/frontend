import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";

import { Providers } from "@/app/providers";
import { brand } from "@/config/brand";
import { siteConfig } from "@/config/site";
import { ServiceWorkerProvider } from "@/features/pwa";
import { publicEnv } from "@/lib/env";

import "./globals.css";

// Roboto (keputusan user 2026-09-22, menggantikan Instrument Sans dari lembar
// brand). Hanya 400–600: yang dibatasi adalah @font-face yang dideklarasikan,
// sehingga `font-bold` tidak mendapat glyph 700 asli. Lint melarang
// font-bold di layar.
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

/**
 * `viewportFit: "cover"` adalah PRASYARAT `env(safe-area-inset-*)`.
 *
 * Tanpa `viewport-fit=cover` di meta viewport, Safari iOS melaporkan keempat
 * inset itu sebagai `0px` — bukan error, hanya nol. Akibatnya bottom tab
 * (`pb-[env(safe-area-inset-bottom)]`) duduk menempel home indicator dan
 * `PageHeader` (`pt-[max(1rem,env(safe-area-inset-top))]`) masuk ke bawah
 * notch. Keempat pemakaian inset di repo ini baru berarti setelah baris ini
 * ada.
 *
 * `themeColor` sengaja SATU nilai terang, bukan sepasang bermedia-query.
 * Token `.dark` di globals.css memang lengkap, tetapi tidak ada apa pun yang
 * memasang `class="dark"` pada `<html>` — jadi dark mode belum menyala.
 * Varian gelap di sini hanya menggelapkan status bar di atas halaman yang
 * tetap putih. Kembalikan pasangannya bersamaan dengan pemasang kelas `.dark`,
 * bukan sebelum itu.
 */
export const viewport: Viewport = {
  viewportFit: "cover",
  // Input ber-font 12px (keputusan user). Safari iOS memperbesar halaman saat
  // memfokus input <16px; `maximum-scale=1` mencegah auto-zoom itu. Di iOS ≥10
  // pinch-zoom manual TETAP bisa (Safari mengabaikan batas ini untuk gestur
  // user). Di Android Chrome batas ini IKUT mematikan pinch-zoom — konsekuensi
  // yang sudah diterima user. Jangan tambahkan `userScalable: false`.
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
