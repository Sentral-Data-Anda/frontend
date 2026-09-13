import { cn } from "@/lib/utils";

/**
 * Skeleton daftar.
 *
 * Tingginya dipatok 56px per baris — sama dengan tinggi baris di `DataList`
 * (lihat mockup "Jemaat — baris 56px, divider inset 52px"). Kalau berbeda,
 * daftar akan melompat saat data tiba, dan lompatan itu terbaca sebagai
 * kedipan.
 */
export function LoadingList({
  rows = 6,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div role="status" aria-busy="true">
      <ul className={cn("divide-border divide-y", className)}>
        {/* key={index} adalah sah DI SINI: skeleton rows tidak punya identitas
            unik dari data, dan urutannya tidak pernah berubah. Perbedaan dengan
            list normal adalah skeleton adalah placeholder sementara, bukan data
            nyata dengan ID yang stabil. */}
        {Array.from({ length: rows }, (_, index) => (
          <li key={index} className="flex h-14 items-center gap-3 px-4">
            <span className="bg-muted size-9 animate-pulse rounded-full" />

            <span className="flex-1 space-y-1.5">
              <span className="bg-muted block h-3 w-2/5 animate-pulse rounded" />
              <span className="bg-muted block h-2.5 w-1/4 animate-pulse rounded" />
            </span>
          </li>
        ))}
      </ul>

      <span className="sr-only">Memuat daftar…</span>
    </div>
  );
}
