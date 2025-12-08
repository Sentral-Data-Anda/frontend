import { Layout } from "@/components";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Kelola",
    template: "%s | KelolaIn",
  },
  description: "Platform digital ",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}
