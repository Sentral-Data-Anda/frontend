import { GalleryContainer as Container } from "@/containers";
import { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    title: "Gallery",
  };
}

export default function Gallery() {
  return <Container />;
}
