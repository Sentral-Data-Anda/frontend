import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

import { SectionTitle } from "@/components/common/section-title";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Kontak",
  description: "Hubungi dan temukan lokasi GKI Graha Raya.",
  path: "/kontak",
});

const contactItems = [
  {
    icon: MapPin,
    label: "Alamat",
    value: siteConfig.contact.address,
  },
  {
    icon: Phone,
    label: "Telepon",
    value: siteConfig.contact.phone,
  },
  {
    icon: Mail,
    label: "Email",
    value: siteConfig.contact.email,
  },
];

export default function KontakPage() {
  return (
    <Container className="py-12">
      <SectionTitle
        title="Kontak"
        subtitle="Kami senang terhubung dengan Anda."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {contactItems.map((item) => (
          <Card key={item.label}>
            <CardContent className="space-y-2">
              <item.icon className="size-5 text-primary" aria-hidden />
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-sm text-muted-foreground">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Link
          href={siteConfig.contact.mapsUrl}
          target="_blank"
          rel="noopener"
          className={buttonVariants()}
        >
          Buka di Google Maps
        </Link>
      </div>
    </Container>
  );
}
