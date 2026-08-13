import { Container } from "@/components/layout/container";
import { GallerySection } from "@/features/gallery";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "Galeri",
  description: "Dokumentasi kegiatan dan momen pelayanan jemaat.",
  path: "/galeri",
});

export default function GaleriPage() {
  return (
    <Container className="py-12">
      <GallerySection />
    </Container>
  );
}
