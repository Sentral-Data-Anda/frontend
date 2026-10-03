import { notFound } from "next/navigation";

import { Panel, PANEL_TITLE } from "@/components/common/display";
import { PageContainer } from "@/components/layout";
import { TaggedTotal } from "@/features/anggaran/shared";

export const metadata = { title: "Kit Anggaran" };

const KOMISI = [
  { key: "a", label: "Komisi Pemuda", amount: "18400000" },
  { key: "b", label: "Komisi Sekolah Minggu", amount: "9250000" },
  { key: "c", label: "Komisi Musik", amount: "6100000" },
  { key: "d", label: "Komisi Diakonia", amount: "4800000" },
];

const CASES = [
  {
    title: "Sisa besar — angka di atasnya adalah pecahan",
    untagged: "243500000",
  },
  { title: "Sisa nol — barisnya tetap ada", untagged: "0" },
  { title: "Belum ada komisi bertanda", untagged: "243500000", parts: [] },
];

export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <PageContainer size="full">
      <div className="space-y-6 py-4">
        {CASES.map((item) => (
          <Panel key={item.title} label={item.title}>
            <h2 className={`${PANEL_TITLE} px-gutter pt-4`}>{item.title}</h2>

            <div className="px-gutter pb-3">
              <TaggedTotal
                label="Belanja per komisi"
                parts={item.parts ?? KOMISI}
                untaggedLabel="Pengeluaran tanpa komisi"
                untagged={item.untagged}
                untaggedHint="Tagihan gereja, gaji, dan yang belum ditandai."
              />
            </div>
          </Panel>
        ))}
      </div>
    </PageContainer>
  );
}
