import { shellWidth, shellWidthDashboard } from "./shell-width";

/**
 * Kolom konten satu layar. Lebar milik layar, bukan `AppShell`: Beranda
 * (`dashboard`) mengisi kolom konten di desktop, layar lain tetap
 * `default` supaya baris daftar tidak direntangkan.
 */
export function PageContainer({
  size = "default",
  children,
}: {
  size?: "default" | "dashboard";
  children: React.ReactNode;
}) {
  return (
    <div className={size === "dashboard" ? shellWidthDashboard : shellWidth}>
      {children}
    </div>
  );
}
