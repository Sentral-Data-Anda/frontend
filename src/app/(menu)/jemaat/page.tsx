import { SubMenuJemaatContainer as Container } from "@/containers";
import { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    title: "Jemaat",
  };
}

export default function Page() {
  return <Container />;
}
