import Container from "@/containers/administrator/activity-logs/Container";
import { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    title: "Activity Logs",
  };
}

export default function Page() {
  return <Container />;
}
