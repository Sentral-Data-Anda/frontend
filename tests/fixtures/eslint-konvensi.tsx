/* eslint-disable */
// Berkas ini SENGAJA melanggar. Ia tidak pernah diimpor kode produksi; yang
// memakainya hanya Step 3 di Task 4, yang menjalankan eslint terhadapnya untuk
// membuktikan aturan konvensi benar-benar menyala. Baris `eslint-disable` di
// atas dicabut oleh perintah di step itu lewat --no-inline-config.
import { useState } from "react";

import { useBoolean } from "@/hooks/use-boolean";

export function Pelanggar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isReady, setIsReady] = useState<boolean>(true);
  const hasFetched = useBoolean();

  return (
    <div onClick={() => setIsOpen(!isOpen)}>
      {String(isReady || hasFetched.value)}
    </div>
  );
}
