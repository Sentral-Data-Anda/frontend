import { shellWidth, shellWidthWide } from "./shell-width";

/**
 * Kolom konten satu layar. Lebar milik layar, bukan `AppShell`: Beranda
 * (`wide`) butuh kolom lebih lebar untuk dashboard, layar lain tetap
 * `default` supaya baris daftar tidak direntangkan.
 */
export function PageContainer({
  size = "default",
  children,
}: {
  size?: "default" | "wide";
  children: React.ReactNode;
}) {
  return (
    <div className={size === "wide" ? shellWidthWide : shellWidth}>
      {children}
    </div>
  );
}
