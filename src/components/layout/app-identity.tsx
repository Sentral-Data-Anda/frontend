import { LogoMark } from "@/components/common/logo";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const TONE = {
  canvas: { mark: "", eyebrow: "text-muted-foreground", role: "" },
  // Bidang logo = primary-900 = latar sidebar, jadi di sidebar bidangnya
  // menyatu dan yang terlihat hanya logonya (6.13:1) — tanpa garis tepi, yang
  // terlihat seperti kotak di dalam kotak.
  sidebar: {
    mark: "",
    eyebrow: "text-sidebar-muted-foreground",
    role: "text-sidebar-foreground",
  },
} as const;

/**
 * Identitas aplikasi: logo + "SADA · SENTRAL DATA ANDA" + nama peran. Satu
 * markup untuk header Beranda (< lg) dan puncak sidebar (≥ lg).
 *
 * Bukan heading: nama peran bukan judul halaman. `h1` Beranda adalah sapaan.
 */
export function AppIdentity({
  role,
  tone = "canvas",
  isCompact = false,
}: {
  role: string;
  tone?: keyof typeof TONE;
  /** Logo saja — sidebar ringkas. */
  isCompact?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <LogoMark className={TONE[tone].mark} />
      <div className={cn("min-w-0", isCompact && "hidden")}>
        <p
          className={cn(
            "truncate text-caption font-medium tracking-wider uppercase",
            TONE[tone].eyebrow,
          )}
        >
          {siteConfig.shortName} · {siteConfig.name}
        </p>
        <p className={cn("truncate text-lead font-semibold", TONE[tone].role)}>
          {role}
        </p>
      </div>
    </div>
  );
}
