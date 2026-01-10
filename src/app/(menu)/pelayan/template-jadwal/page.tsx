import { TemplatePelayanContainer as Container } from "@/containers";
import { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    title: "Template Jadwal",
  };
}

export default function Page() {
  return <Container />;
}
