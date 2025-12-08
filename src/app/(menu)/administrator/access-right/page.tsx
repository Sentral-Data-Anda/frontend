import { AccessRightContainer as Container } from "@/containers";
import { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    title: "Hak Akses User",
  };
}

export default function Page() {
  return <Container />;
}
