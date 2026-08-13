import { SectionTitle } from "@/components/common/section-title";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/config/site";

const values = [
  {
    title: "Visi",
    description:
      "Menjadi gereja yang bertumbuh dalam iman, kasih, dan pelayanan bagi sesama.",
  },
  {
    title: "Misi",
    description:
      "Memberitakan Injil, membina jemaat, dan melayani masyarakat dengan kasih Kristus.",
  },
  {
    title: "Nilai",
    description:
      "Kasih, integritas, dan kebersamaan menjadi dasar setiap pelayanan kami.",
  },
];

/**
 * Feature profil bersifat statis (tidak fetch API).
 * Ganti teks placeholder berikut dengan profil & sejarah gereja sebenarnya.
 */
export function AboutSection({ withHeader = true }: { withHeader?: boolean }) {
  return (
    <div>
      {withHeader ? (
        <SectionTitle
          title={`Tentang ${siteConfig.name}`}
          subtitle="Mengenal lebih dekat keluarga besar jemaat kami."
        />
      ) : null}

      <div className="space-y-4 text-muted-foreground">
        <p>
          {siteConfig.name} adalah persekutuan jemaat yang berkomitmen melayani
          Tuhan dan sesama. Halaman ini menampilkan profil dan sejarah singkat
          gereja — silakan sesuaikan dengan konten resmi.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {values.map((item) => (
          <Card key={item.title}>
            <CardContent className="space-y-2">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
