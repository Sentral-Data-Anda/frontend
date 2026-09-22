import Link from "next/link";

/**
 * Judul satu bagian di dalam layar ("Aksi cepat", "Hari ini"), dengan tautan
 * opsional di kanan. `h2`, karena `h1` milik `PageHeader`.
 *
 * `isTitleHidden`: judul hanya untuk pembaca layar (bagian tetap punya nama),
 * tautan kanan tetap tampil — dipakai "Aksi cepat" di Beranda.
 */
export function SectionHeader({
  title,
  isTitleHidden,
  actionLabel,
  actionHref,
}: {
  title: string;
  isTitleHidden?: boolean;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3 has-[h2.sr-only]:justify-end">
      <h2 className={isTitleHidden ? "sr-only" : "text-title font-semibold"}>
        {title}
      </h2>

      {actionLabel && actionHref ? (
        // min-h-6: target sentuh 24px (WCAG 2.5.8) tanpa menggeser baseline.
        <Link
          href={actionHref}
          className="focus-visible:ring-ring inline-flex min-h-6 items-center rounded-control text-body font-medium underline-offset-2 outline-none hover:underline focus-visible:ring-2"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
