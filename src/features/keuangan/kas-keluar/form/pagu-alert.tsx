"use client";

import { FormAlert } from "@/components/common/form";
import { formatAmount } from "@/lib/format";
import { overBy, sumAmounts } from "@/lib/number";

import { useCeiling } from "../api";

interface PropTypes {
  bapelId: string;
  bapelName: string;
  expenseDate: string;
  /** The draft's line amounts, as the form holds them. */
  amounts: readonly string[];
}

// INDIKATOR, bukan penjaga, dan di sini itu bukan kehati-hatian FE — gereja
// memilih memperingatkan pelampauan pagu, bukan menolaknya. Server pun tidak
// menolaknya: `ceilingForDate` tidak melempar apa pun karena pelampauan.
// Simpan tetap aktif dalam setiap keadaan di bawah.
export const PaguAlert = (props: PropTypes) => {
  const { bapelId, bapelName, expenseDate, amounts } = props;

  const ceiling = useCeiling(bapelId, expenseDate);
  const data = ceiling.data;

  // Dijaga pada field yang benar-benar dibaca, bukan hanya pada `data`.
  // Spanduk yang sifatnya memberi tahu tidak boleh bisa menjatuhkan seluruh
  // form kalau badan responsnya tak seperti yang dijanjikan — dan catch-all
  // GET di test form ini membuktikan bahwa itu bisa terjadi.
  if (!data?.budgetYear) return null;

  const { label } = data.budgetYear;

  // `usage` null = pagu komisi ini bukan hak peran ini untuk dilihat. Bukan
  // "belum ditetapkan" — server memisahkan keduanya justru supaya layar tidak
  // menyuruh komisi meminta pagu yang sudah ada.
  if (!data.usage) {
    return (
      <FormAlert
        tone="info"
        title={`Sisa pagu ${bapelName} tidak terlihat untuk peran Anda.`}
        message="Kas keluar ini tetap bisa disimpan. Bendahara dan Majelis yang bisa melihat sisa pagunya."
      />
    );
  }

  const { ceiling: limit, disbursed } = data.usage;

  if (!limit) {
    return (
      <FormAlert
        tone="info"
        title={`Majelis belum menetapkan pagu ${bapelName} untuk tahun pelayanan ${label}.`}
        message="Kas keluar ini tetap bisa disimpan, dan belum ada angka untuk membandingkannya."
      />
    );
  }

  const draft = sumAmounts([...amounts]);
  const excess = overBy(limit, disbursed, draft);

  // Masih di dalam pagu: tidak ada spanduk. Sisa pagu yang aman bukan kabar
  // yang perlu menyita ruang di atas setiap baris.
  if (!excess) return null;

  return (
    <FormAlert
      tone="warning"
      title={`Kas keluar ini membuat pencairan ${bapelName} melampaui pagu tahun pelayanan ${label} sebesar ${formatAmount(excess)}.`}
      message={`Pagu ${formatAmount(limit)}, sudah dicairkan ${formatAmount(disbursed)}, kas keluar ini ${formatAmount(draft)}. Pencairan tidak ditolak karena pelampauan — periksa dulu sebelum menyimpan.`}
    />
  );
};
