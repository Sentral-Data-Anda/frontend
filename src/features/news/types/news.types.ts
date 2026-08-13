export type News = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  coverImageUrl?: string;
  category?: string;
  publishedAt: string; // ISO date string
};
