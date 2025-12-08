import { RoleJemaatContainer as Container } from "@/containers";
import { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    title: "Role Jemaat",
  };
}

export default function Page() {
  return <Container />;
}
