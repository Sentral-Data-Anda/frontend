import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

import type { News } from "../types/news.types";

export function NewsCard({ news }: { news: News }) {
  return (
    <Card className="flex flex-col overflow-hidden pt-0 transition-shadow hover:shadow-md">
      <div
        className="aspect-[16/9] w-full bg-muted bg-cover bg-center"
        style={
          news.coverImageUrl
            ? { backgroundImage: `url(${news.coverImageUrl})` }
            : undefined
        }
        role="img"
        aria-label={news.title}
      />

      <CardHeader>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {news.category ? `${news.category} · ` : ""}
          {formatDate(news.publishedAt)}
        </p>
        <CardTitle className="line-clamp-2 text-lg leading-snug">
          <Link href={`/berita/${news.slug}`} className="hover:underline">
            {news.title}
          </Link>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {news.excerpt}
        </p>
      </CardContent>
    </Card>
  );
}
