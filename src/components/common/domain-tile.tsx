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

/**
 * Ikon domain ber-tint dengan label di bawahnya.
 *
 * Hanya isi: pembungkus interaktifnya (`Link` di Beranda, `button` pembuka
 * sheet di Semua modul) milik pemanggil.
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
  const Icon = MENU_ICON[slug];

  return (
    <span className="flex flex-col items-center gap-1.5 text-center">
      <span
        className={`flex size-12 items-center justify-center rounded-lg ${TINT[DOMAIN_TINT[slug] ?? "primary"]}`}
      >
        {Icon ? <Icon className="size-5" aria-hidden /> : null}
      </span>

      <span className="text-body leading-tight">{label}</span>

      {meta ? (
        <span className="text-muted-foreground text-caption tabular-nums">
          {meta}
        </span>
      ) : null}
    </span>
  );
}
