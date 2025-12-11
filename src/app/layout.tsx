import { Roboto } from "next/font/google";

import "./globals.css";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";

import { MantineProvider } from "@mantine/core";
import { theme } from "@/utils/customTheme";
import { Notifications } from "@mantine/notifications";
import { SocketProvider } from "@/hooks/useSocket";
import { Viewport } from "next";
import { RegisterSW } from "@/components";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const roboto = Roboto({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "SADA",
  description: "Sentral Data Anda",
  icons: {
    icon: "/favicon.ico",
    apple: [{ url: "/apple-icon.png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
  },
  mobileWebApp: {
    capable: true,
  },
};

export const viewport: Viewport = {
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${roboto.className}`}
        style={{ backgroundColor: "#e6e6e6" }}>
        <RegisterSW />

        <MantineProvider theme={theme}>
          <SocketProvider>
            <Notifications limit={3} />
            {children}
            <Analytics />
            <SpeedInsights />
          </SocketProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
