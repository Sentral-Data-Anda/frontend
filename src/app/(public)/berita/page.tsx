import { Container } from "@/components/layout/container";
import { AnnouncementSection } from "@/features/announcement";
import { NewsSection } from "@/features/news";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "Berita & Pengumuman",
  description: "Kabar terbaru dan pengumuman seputar pelayanan jemaat.",
  path: "/berita",
});

export default function BeritaPage() {
  return (
    <Container className="space-y-16 py-12">
      <NewsSection />
      <AnnouncementSection />
    </Container>
  );
}
