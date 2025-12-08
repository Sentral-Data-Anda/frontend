import { AgendaContainer as Container } from "@/containers";
import { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    title: "Agenda",
  };
}

export default function Agenda() {
  return <Container />;
}
