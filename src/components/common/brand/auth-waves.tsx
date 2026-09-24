import { cn } from "@/lib/utils";

/**
 * Ornamen gelombang untuk layar sebelum masuk. Murni dekorasi: `aria-hidden`,
 * tidak menangkap klik, dan warnanya `currentColor` — atur lewat kelas teks
 * (`text-primary/10`, `text-primary-foreground/15`) supaya ikut token.
 * Posisi dan ukuran sepenuhnya milik pemanggil lewat `className`.
 */
export function AuthWaves({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 160"
      preserveAspectRatio="none"
      fill="currentColor"
      aria-hidden
      focusable="false"
      className={cn("pointer-events-none", className)}
    >
      <path
        opacity="0.45"
        d="M0 0h400v70c-40 28-92 40-150 22S140 44 86 58 18 104 0 118Z"
      />
      <path
        opacity="0.7"
        d="M0 0h400v38c-46 22-98 30-152 12S146 14 94 30 24 76 0 88Z"
      />
      <path d="M0 0h400v14c-50 16-100 20-150 6S150-2 100 12 30 50 0 60Z" />
    </svg>
  );
}
