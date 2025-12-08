import { RolePelayanContainer as Container } from "@/containers";
import { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    title: "Role Pelayan",
  };
}

export default function Page() {
  return <Container />;
}
