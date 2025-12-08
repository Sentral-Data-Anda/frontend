import Container from "@/containers/barang/tipe-barang/Container";
import { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    title: "Tipe Barang",
  };
}

export default function Page() {
  return <Container />;
}
