import { Layout } from "@/components";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "SADA",
    template: "%s | SADA",
  },
  description: "Sentral Data Anda",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}
