import { shellWidth, shellWidthFull } from "./shell-width";

/**
 * Kolom konten satu layar. Lebar milik layar, bukan `AppShell`: Beranda dan
 * layar daftar bertabel (`full`) mengisi kolom konten di desktop, layar lain
 * tetap `default`.
 */
export function PageContainer({
  size = "default",
  children,
}: {
  size?: "default" | "full";
  children: React.ReactNode;
}) {
  return (
    <div className={size === "full" ? shellWidthFull : shellWidth}>
      {children}
    </div>
  );
}
