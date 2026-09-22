import { PageContainer } from "@/components/layout/page-container";

import { ModuleGrid } from "./module-grid";

export const metadata = { title: "Pencarian" };

/**
 * Sengaja tipis. Seluruh isinya berasal dari sesi yang sudah dibagikan
 * `SessionProvider`, jadi tidak ada panggilan API kedua di sini — itulah
 * kenapa `ModuleGrid` client, bukan server.
 */
export default function Page() {
  return (
    <PageContainer>
      <ModuleGrid />
    </PageContainer>
  );
}
