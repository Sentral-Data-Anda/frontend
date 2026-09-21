import { notFound } from "next/navigation";

import { isSafeRedirectPath } from "@/lib/redirect";

export const metadata = { title: "Pratinjau responsif" };

/**
 * Tiga ukuran acuan review, urut seperti user me-review: mobile → tablet →
 * desktop. Desktop diperkecil dengan `transform` supaya muat di layar yang
 * sama; iframe-nya tetap 1440px sehingga breakpoint `lg` benar-benar menyala.
 */
const FRAMES = [
  { label: "Mobile", width: 390, height: 844, scale: 1 },
  { label: "Tablet", width: 820, height: 1180, scale: 1 },
  { label: "Desktop", width: 1440, height: 900, scale: 0.5 },
] as const;

/**
 * Alat review development-only: `/dev/preview?path=/kejemaatan/daftar-jemaat`.
 *
 * Halaman ini sendiri terbuka tanpa sesi di development (lihat PUBLIC_PATHS
 * di proxy.ts) supaya `?path=/login` bisa dipratinjau saat belum masuk; tiap
 * iframe tetap lewat gerbang auth. Iframe same-origin hanya diizinkan di
 * development (`frame-ancestors 'self'` di csp.ts, `X-Frame-Options:
 * SAMEORIGIN` di next.config.ts); di production keduanya tetap menolak.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ path?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const { path } = await searchParams;
  // Hanya path di origin ini: `?path=https://situs-lain` tidak boleh menjadi
  // iframe di halaman kita.
  const src = isSafeRedirectPath(path) ? path : "/";

  return (
    <div className="bg-muted min-h-dvh overflow-x-auto p-6">
      <p className="text-muted-foreground mb-4 font-mono text-body">{src}</p>

      <div className="flex w-max items-start gap-6">
        {FRAMES.map((frame) => (
          <figure key={frame.label} className="flex flex-col gap-2">
            <figcaption className="text-body font-medium">
              {frame.label} · {frame.width}×{frame.height}
              {frame.scale !== 1 ? ` (skala ${frame.scale * 100}%)` : ""}
            </figcaption>

            <div
              className="border-border bg-background overflow-hidden rounded-lg border shadow-sm"
              style={{
                width: frame.width * frame.scale,
                height: frame.height * frame.scale,
              }}
            >
              <iframe
                src={src}
                title={`${frame.label} ${frame.width}×${frame.height}`}
                width={frame.width}
                height={frame.height}
                className="block origin-top-left"
                style={{ transform: `scale(${frame.scale})` }}
              />
            </div>
          </figure>
        ))}
      </div>
    </div>
  );
}
