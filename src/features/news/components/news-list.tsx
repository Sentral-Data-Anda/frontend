import type { News } from "../types/news.types";

import { NewsCard } from "./news-card";

export function NewsList({ items }: { items: News[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((news) => (
        <NewsCard key={news.id} news={news} />
      ))}
    </div>
  );
}
