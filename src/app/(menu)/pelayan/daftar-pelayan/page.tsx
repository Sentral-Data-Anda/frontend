import { DaftarPelayanContainer as Container } from "@/containers";
import { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    title: "Daftar Pelayan",
  };
}

export default function Page() {
  return <Container />;
}
