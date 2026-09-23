"use client";

import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/features/pwa/hooks/use-install-prompt";

/**
 * Ajakan memasang aplikasi, sadar-platform.
 *
 * Komponen ini TIDAK dipasang di root layout. Ia disediakan untuk ditempatkan
 * pada titik di mana user sudah melihat nilai aplikasi — misalnya halaman
 * Pengaturan, atau setelah user pertama kali membuka jadwalnya. Menawarkan
 * instalasi saat halaman baru dibuka menghasilkan penolakan tinggi, dan pada
 * Chrome rasio penolakan tinggi menurunkan situs ke prompt yang lebih senyap
 * secara permanen.
 */
export function InstallPrompt() {
  const { canPrompt, needsManualGuide, promptInstall } = useInstallPrompt();

  if (canPrompt) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border p-3.5">
        <p className="text-body font-medium">Pasang SADA di perangkat ini</p>
        <p className="text-muted-foreground text-caption">
          Aplikasi terbuka di jendelanya sendiri, tanpa alamat browser.
        </p>
        <Button size="sm" className="self-start" onClick={promptInstall}>
          Pasang
        </Button>
      </div>
    );
  }

  // Safari iOS tidak punya prompt otomatis dan tidak mendukung
  // `beforeinstallprompt`, jadi tombol "Pasang" di sini hanya akan diam saat
  // diklik. Yang bisa diberikan cuma panduan.
  if (needsManualGuide) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border p-3.5">
        <p className="text-body font-medium">Pasang SADA di perangkat ini</p>
        <p className="text-muted-foreground text-caption">
          Di Safari, ketuk tombol Bagikan lalu pilih{" "}
          <strong>Tambahkan ke Layar Utama</strong>.
        </p>
        <p className="text-muted-foreground text-caption">
          Notifikasi di iPhone dan iPad baru bisa diaktifkan setelah aplikasi
          terpasang ke Layar Utama.
        </p>
      </div>
    );
  }

  return null;
}
