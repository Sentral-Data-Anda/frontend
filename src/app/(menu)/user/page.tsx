import { DetailUserContainer as Container } from "@/containers";
import { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    title: "Detail User",
  };
}

export default function ManagementUser() {
  return <Container />;
}
