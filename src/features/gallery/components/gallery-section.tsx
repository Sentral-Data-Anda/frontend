import { EmptyState } from "@/components/common/empty-state";
import { SectionTitle } from "@/components/common/section-title";

import { getGalleries } from "../services/gallery.service";
import type { GalleryItem } from "../types/gallery.types";

export async function GallerySection({
  limit,
  withHeader = true,
}: {
  limit?: number;
  withHeader?: boolean;
}) {
  let items: GalleryItem[] = [];

  try {
    items = await getGalleries();
  } catch {
    items = [];
  }

  const visible = limit ? items.slice(0, limit) : items;

  return (
    <div>
      {withHeader ? (
        <SectionTitle
          title="Galeri"
          subtitle="Dokumentasi kegiatan dan momen pelayanan jemaat."
        />
      ) : null}

      {visible.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((item) => (
            <div
              key={item.id}
              className="aspect-square overflow-hidden rounded-lg bg-muted bg-cover bg-center"
              style={{ backgroundImage: `url(${item.imageUrl})` }}
              role="img"
              aria-label={item.title ?? "Dokumentasi"}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Galeri masih kosong"
          description="Foto kegiatan akan tampil di sini setelah diunggah."
        />
      )}
    </div>
  );
}
