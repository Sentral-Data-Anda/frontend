import { Container } from "@/components/layout/container";
import { AboutSection } from "@/features/about";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Tentang",
  description: "Profil dan sejarah singkat GKI Graha Raya.",
  path: "/tentang",
});

export default function TentangPage() {
  return (
    <Container className="py-12">
      <AboutSection />
    </Container>
  );
}
