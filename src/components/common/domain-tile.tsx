import type { LucideIcon } from "lucide-react";

import { MENU, MENU_ICON } from "@/config/menu";

/**
 * Tint per domain, mengikuti warna tile di `docs/design/beranda-reference.png`.
 *
 * Hidup di sini, bukan di layar: lint melarang langkah skala (`bg-primary-50`)
 * di `src/app` dan `src/features`. Ikon memakai langkah 900 dari skala yang
 * sama — kontras non-teks (WCAG 1.4.11, syarat 3:1) di atas bidangnya:
 * primary 6.74, secondary 5.59, warning 3.11, success 4.92. Label tidak pernah
 * berwarna; ia di bawah tile, di atas putih.
 *
 * Empat domain yang tidak ada di mockup dipasangkan menurut kedekatan isi.
 */
const TINT = {
  primary: "bg-primary-100 text-primary-900",
  secondary: "bg-secondary-50 text-secondary-900",
  warning: "bg-warning-100 text-warning-900",
  success: "bg-success-50 text-success-900",
} as const;

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
  lg: { box: "size-16 rounded-lg", icon: "size-7" },
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
      className={`flex shrink-0 items-center justify-center ${ICON_SIZE[size].box} ${TINT[DOMAIN_TINT[slug] ?? "primary"]}`}
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
  size = "md",
}: {
  slug: string;
  label: string;
  /** Baris kecil di bawah label, mis. "7 layar". */
  meta?: string;
  size?: "md" | "lg";
}) {
  return (
    <span className="flex flex-col items-center gap-1.5 text-center">
      <DomainIcon slug={slug} size={size} />

      <span className="text-body leading-tight">{label}</span>

      {meta ? (
        <span className="text-muted-foreground text-caption tabular-nums">
          {meta}
        </span>
      ) : null}
    </span>
  );
}
