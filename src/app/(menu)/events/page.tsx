import { EventsContainer as Container } from "@/containers";
import { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    title: "Events",
  };
}

export default function Events() {
  return <Container />;
}
