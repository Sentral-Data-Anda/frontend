import { DaftarJemaatContainer as Container } from "@/containers";
import { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    title: "Daftar Jemaat",
  };
}

export default function Page() {
  return <Container />;
}
