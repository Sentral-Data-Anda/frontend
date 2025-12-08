import { BarangContainer as Container } from "@/containers";
import { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    title: "Barang",
  };
}

export default function Page() {
  return <Container />;
}
