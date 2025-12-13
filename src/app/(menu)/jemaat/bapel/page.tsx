import { BapelContainer as Container } from "@/containers";
import { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    title: "Badan Pelayanan",
  };
}

export default function Page() {
  return <Container />;
}
