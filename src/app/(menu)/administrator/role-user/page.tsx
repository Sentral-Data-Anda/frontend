import { RoleUserContainer as Container } from "@/containers";
import { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    title: "Role User",
  };
}

export default function Page() {
  return <Container />;
}
