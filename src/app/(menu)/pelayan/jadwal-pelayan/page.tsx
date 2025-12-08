import { JadwalPelayanContainer as Container } from "@/containers";
import { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    title: "Jadwal Pelayan",
  };
}

export default function Page() {
  return <Container />;
}
