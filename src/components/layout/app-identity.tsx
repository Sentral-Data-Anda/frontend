import { LogoMark } from "@/components/common/logo";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const TONE = {
  canvas: { mark: "", eyebrow: "text-muted-foreground", role: "" },
  // Bidang logo = primary-900 = latar sidebar; garis tipis membuatnya tetap
  // terbaca sebagai lencana. Ikon di atas bidangnya tetap 6.13:1.
  sidebar: {
    mark: "ring-1 ring-sidebar-border",
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
}: {
  role: string;
  tone?: keyof typeof TONE;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <LogoMark className={TONE[tone].mark} />
      <div className="min-w-0">
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
