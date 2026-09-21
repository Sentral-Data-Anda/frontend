import type { LucideIcon } from "lucide-react";

import { MENU, MENU_ICON } from "@/config/menu";

/**
 * Tint per domain, mengikuti warna tile di `docs/design/beranda-reference.png`.
 *
 * Hidup di sini, bukan di layar: lint melarang langkah skala (`bg-primary-50`)
 * di `src/app` dan `src/features`. Ikon memakai langkah 900 dari skala yang
 * sama — kontras non-teks (WCAG 1.4.11, syarat 3:1) di atas bidangnya:
 * primary 6.74, secondary 5.02, warning 3.11, success 4.46. Semua bidang langkah
 * 100: langkah 50 (secondary/success) hilang di atas kanvas primary-50.
 * Label tidak pernah berwarna.
 *
 * Empat domain yang tidak ada di mockup dipasangkan menurut kedekatan isi.
 */
const TINT = {
  primary: { bg: "bg-primary-100", fg: "text-primary-900" },
  secondary: { bg: "bg-secondary-100", fg: "text-secondary-900" },
  warning: { bg: "bg-warning-100", fg: "text-warning-900" },
  success: { bg: "bg-success-100", fg: "text-success-900" },
} as const;

const tintOf = (slug: string) => TINT[DOMAIN_TINT[slug] ?? "primary"];

const DOMAIN_TINT: Record<string, keyof typeof TINT> = {
  [MENU.KEJEMAATAN]: "primary",
  [MENU.INVENTARIS]: "primary",
  [MENU.PERSETUJUAN]: "primary",
  [MENU.PENGATURAN]: "primary",
  [MENU.PELAYANAN]: "secondary",
  [MENU.PENGADAAN]: "secondary",
  [MENU.PERIBADAHAN]: "secondary",
  [MENU.KEGIATAN]: "warning",
  [MENU.KEUANGAN]: "warning",
  [MENU.ANGGARAN]: "warning",
  [MENU.FASILITAS]: "success",
  [MENU.SDM]: "success",
};

const ICON_SIZE = {
  sm: { box: "size-control rounded-control", icon: "size-4" },
  md: { box: "size-12 rounded-lg", icon: "size-5" },
} as const;

/**
 * Kotak ber-tint domain berisi ikon. Diekspor supaya tile lain (mis.
 * `MenuTile`) memakai tint yang sama tanpa menyalin tabelnya.
 */
export function DomainIcon({
  slug,
  icon,
  size = "md",
}: {
  /** Slug domain: menentukan tint, dan ikon bila `icon` kosong. */
  slug: string;
  icon?: LucideIcon;
  size?: keyof typeof ICON_SIZE;
}) {
  const Icon = icon ?? MENU_ICON[slug];

  return (
    <span
      className={`flex shrink-0 items-center justify-center ${ICON_SIZE[size].box} ${tintOf(slug).bg} ${tintOf(slug).fg}`}
    >
      {Icon ? <Icon className={ICON_SIZE[size].icon} aria-hidden /> : null}
    </span>
  );
}

/**
 * Ikon domain ber-tint dengan label di bawahnya.
 *
 * Hanya isi: pembungkus interaktifnya (`Link` di Beranda dan Semua modul)
 * milik pemanggil.
 */
export function DomainTile({
  slug,
  label,
  meta,
}: {
  slug: string;
  label: string;
  /** Baris kecil di bawah label, mis. "7 layar". */
  meta?: string;
}) {
  return (
    <span className="flex flex-col items-center gap-1.5 text-center">
      <DomainIcon slug={slug} />

      <span className="text-body leading-tight">{label}</span>

      {meta ? (
        <span className="text-muted-foreground text-caption tabular-nums">
          {meta}
        </span>
      ) : null}
    </span>
  );
}

/**
 * Banner kepala halaman domain: bidang tint domain, ikon di kotak putih,
 * nama rata kiri. Teks memakai `foreground`,
 * bukan warna tint — warning-900 di atas warning-100 hanya 3.11, cukup untuk
 * ikon, tidak untuk teks (foreground ≥ 6.7 di keempat tint).
 * Ikon 900 di atas putih: 8.44 / 6.02 / 3.43 / 5.26.
 */
export function DomainBanner({ slug, label }: { slug: string; label: string }) {
  const Icon = MENU_ICON[slug];
  const tint = tintOf(slug);

  return (
    <div className={`flex items-center gap-3 rounded-lg p-3.5 ${tint.bg}`}>
      <span
        className={`bg-card flex size-12 shrink-0 items-center justify-center rounded-lg ${tint.fg}`}
      >
        {Icon ? <Icon className="size-5" aria-hidden /> : null}
      </span>

      <span className="min-w-0 text-title font-semibold">{label}</span>
    </div>
  );
}
