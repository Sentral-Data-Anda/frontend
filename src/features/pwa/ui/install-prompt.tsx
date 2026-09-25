"use client";

import { Button } from "@/components/common/control/button";
import { useInstallPrompt } from "@/features/pwa/hooks/use-install-prompt";

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
