import { Container } from "@/components/layout/container";
import { ScheduleSection } from "@/features/schedule";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "Jadwal Ibadah",
  description: "Jadwal ibadah rutin GKI Graha Raya.",
  path: "/jadwal",
});

export default function JadwalPage() {
  return (
    <Container className="py-12">
      <ScheduleSection />
    </Container>
  );
}
