import Link from "next/link";

import { Container } from "@/components/layout/container";
import { FadeIn } from "@/components/motion/fade-in";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { AboutSection } from "@/features/about";
import { GallerySection } from "@/features/gallery";
import { NewsSection } from "@/features/news";
import { ScheduleSection } from "@/features/schedule";

// ISR: beranda di-cache, konten dinamis tetap di-refresh per service.
export const revalidate = 300;

export default function HomePage() {
  return (
    <>
      <section className="border-b bg-muted/30">
        <Container className="py-20 text-center sm:py-28">
          <FadeIn>
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
              Selamat Datang di {siteConfig.name}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-muted-foreground">
              {siteConfig.description}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/jadwal" className={buttonVariants({ size: "lg" })}>
                Jadwal Ibadah
              </Link>
              <Link
                href="/tentang"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                Tentang Kami
              </Link>
            </div>
          </FadeIn>
        </Container>
      </section>

      <Container className="space-y-20 py-16">
        <FadeIn>
          <AboutSection />
        </FadeIn>

        <FadeIn>
          <section id="jadwal" className="scroll-mt-20">
            <ScheduleSection />
          </section>
        </FadeIn>

        <FadeIn>
          <section id="berita" className="scroll-mt-20">
            <NewsSection limit={3} withViewAll />
          </section>
        </FadeIn>

        <FadeIn>
          <section id="galeri" className="scroll-mt-20">
            <GallerySection limit={8} />
          </section>
        </FadeIn>
      </Container>
    </>
  );
}
