import { SubMenuReportContainer as Container } from "@/containers";
import { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    title: "Report",
  };
}

export default function Page() {
  return <Container />;
}
