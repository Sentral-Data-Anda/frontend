import { SubMenuPelayanContainer as Container } from "@/containers";
import { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    title: "Pelayan",
  };
}

export default function Page() {
  return <Container />;
}
