import { ReportJemaatContainer as Container } from "@/containers";
import { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    title: "Report Jemaat",
  };
}

export default function Page() {
  return <Container />;
}
