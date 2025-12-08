import { DashboardContainer as Container } from "@/containers";
import { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    title: "Dashboard",
  };
}

export default function Page() {
  return <Container />;
}
