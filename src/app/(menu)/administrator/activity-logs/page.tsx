import { ActivityLogsContainer as Container } from "@/containers";
import { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    title: "Activity Logs",
  };
}

export default function Page() {
  return <Container />;
}
