import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { getNewsBySlug } from "@/features/news";
import { formatDate } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const news = await getNewsBySlug(slug).catch(() => null);

  if (!news) {
    return buildMetadata({ title: "Berita", path: `/berita/${slug}` });
  }

  return buildMetadata({
    title: news.title,
    description: news.excerpt,
    path: `/berita/${slug}`,
  });
}

export default async function BeritaDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const news = await getNewsBySlug(slug).catch(() => null);

  if (!news) {
    notFound();
  }

  return (
    <Container className="py-12">
      <article className="mx-auto max-w-3xl">
        <p className="text-sm text-muted-foreground">
          {news.category ? `${news.category} · ` : ""}
          {formatDate(news.publishedAt)}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          {news.title}
        </h1>

        {news.coverImageUrl ? (
          <div
            className="mt-6 aspect-[16/9] w-full rounded-lg bg-muted bg-cover bg-center"
            style={{ backgroundImage: `url(${news.coverImageUrl})` }}
            role="img"
            aria-label={news.title}
          />
        ) : null}

        <div className="mt-6 whitespace-pre-line text-base leading-7 text-foreground/90">
          {news.content ?? news.excerpt}
        </div>
      </article>
    </Container>
  );
}
