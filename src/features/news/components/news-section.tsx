import Link from "next/link";

import { EmptyState } from "@/components/common/empty-state";
import { SectionTitle } from "@/components/common/section-title";
import { buttonVariants } from "@/components/ui/button";

import { getNewsList } from "../services/news.service";
import type { News } from "../types/news.types";

import { NewsList } from "./news-list";

/**
 * Pintu masuk feature berita: fetch data lalu rakit komponen.
 * `limit` untuk menampilkan cuplikan (mis. di beranda).
 */
export async function NewsSection({
  limit,
  withHeader = true,
  withViewAll = false,
}: {
  limit?: number;
  withHeader?: boolean;
  withViewAll?: boolean;
}) {
  let items: News[] = [];

  try {
    items = await getNewsList();
  } catch {
    // API belum tersedia / gagal — tampilkan empty state, jangan jatuhkan halaman.
    items = [];
  }

  const visible = limit ? items.slice(0, limit) : items;

  return (
    <div>
      {withHeader ? (
        <div className="flex items-end justify-between gap-4">
          <SectionTitle
            title="Berita & Pengumuman"
            subtitle="Kabar terbaru seputar pelayanan dan kegiatan jemaat."
          />
          {withViewAll ? (
            <Link
              href="/berita"
              className={buttonVariants({
                variant: "outline",
                className: "mb-8 shrink-0",
              })}
            >
              Lihat semua
            </Link>
          ) : null}
        </div>
      ) : null}

      {visible.length > 0 ? (
        <NewsList items={visible} />
      ) : (
        <EmptyState
          title="Belum ada berita"
          description="Berita dan pengumuman akan tampil di sini setelah dipublikasikan."
        />
      )}
    </div>
  );
}
