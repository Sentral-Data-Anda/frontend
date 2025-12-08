import { RuanganContainer as Container } from "@/containers";
import { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    title: "Ruangan",
  };
}

export default function Page() {
  return <Container />;
}
