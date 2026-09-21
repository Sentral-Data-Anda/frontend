import Link from "next/link";

/**
 * Judul satu bagian di dalam layar ("Aksi cepat", "Hari ini"), dengan tautan
 * opsional di kanan. `h2`, karena `h1` milik `PageHeader`.
 */
export function SectionHeader({
  title,
  actionLabel,
  actionHref,
}: {
  title: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-title font-semibold">{title}</h2>

      {actionLabel && actionHref ? (
        // min-h-6: target sentuh 24px (WCAG 2.5.8) tanpa menggeser baseline.
        <Link
          href={actionHref}
          className="inline-flex min-h-6 items-center text-body font-medium"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
