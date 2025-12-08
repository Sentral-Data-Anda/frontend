import { UserContainer as Container } from "@/containers";
import { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    title: "User",
  };
}

export default function Page() {
  return <Container />;
}
