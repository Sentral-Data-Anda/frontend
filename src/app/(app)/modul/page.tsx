import { PageContainer } from "@/components/layout/page-container";
import { PencarianScreen } from "@/features/pencarian/screen";

export const metadata = { title: "Pencarian" };

/**
 * Sengaja tipis. Seluruh isinya berasal dari sesi yang sudah dibagikan
 * `SessionProvider`, jadi tidak ada panggilan API kedua di sini — itulah
 * kenapa layarnya client, bukan server.
 */
export default function Page() {
  return (
    <PageContainer>
      <PencarianScreen />
    </PageContainer>
  );
}
