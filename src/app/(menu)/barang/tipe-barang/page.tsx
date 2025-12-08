import { TipeBarangContainer as Container } from "@/containers";
import { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    title: "Tipe Barang",
  };
}

export default function Page() {
  return <Container />;
}
