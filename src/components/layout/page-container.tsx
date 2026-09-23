import { shellWidth, shellWidthDashboard, shellWidthWide } from "./shell-width";

/**
 * Kolom konten satu layar. Lebar milik layar, bukan `AppShell`: Beranda
 * (`dashboard`) mengisi kolom konten di desktop, layar lain tetap
 * `default` supaya baris daftar tidak direntangkan.
 */
export function PageContainer({
  size = "default",
  children,
}: {
  /** `wide`: daftar bertabel, selebar form (`shellWidthWide`). */
  size?: "default" | "dashboard" | "wide";
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        size === "dashboard"
          ? shellWidthDashboard
          : size === "wide"
            ? shellWidthWide
            : shellWidth
      }
    >
      {children}
    </div>
  );
}
