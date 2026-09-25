# Gaya Kode fe-sada

Aturan menulis kode di repo ini. Bentuknya mengikuti `STANDARDS.md` di
monorepo-apower-fe, diringkas untuk Next.js + Tailwind + shadcn di sini.
Pelanggaran aturan WAJIB berarti belum layak merge.

Keputusan desain (kenapa sebuah layar tampak begitu, angka kontras, ukuran
piksel) tidak ditulis di kode. Tempatnya `../docs/design/` dan
`../docs/decisions/fe-kode/`.

## WAJIB

**[WAJIB-1] Komentar hampir nol.**
Kode harus terbaca tanpa komentar. Komentar hanya boleh 1–2 baris, untuk alasan
yang tidak terlihat dari kodenya: workaround peramban atau pustaka, angka ajaib,
urutan yang tidak boleh ditukar.

Dilarang:

- paragraf JSDoc yang menceritakan isi fungsi;
- penanda seksi (`// ---- State ----`);
- nomor dokumen atau tiket (`§13.4`, `B15`, `Fase 3b`);
- hitungan piksel dan kontras;
- riwayat ("dulu …, sekarang …").

```ts
// SALAH
/**
 * Mengambil daftar jemaat berhalaman. be-sada menjawab 404 saat filter kosong
 * (lihat list-state.md §2.6), jadi 404 diterjemahkan menjadi daftar kosong.
 */

// BENAR
// be-sada menjawab 404 untuk daftar kosong.
```

`eslint-disable`, `@ts-expect-error`, dan `"use client"` bukan komentar dan
tidak terkena aturan ini.

**[WAJIB-2] Awalan nama.**

- Boolean diawali `is`, termasuk hasil `useBoolean()`: `isOpen`, `isEdit`,
  `isCanUpdate`. `has`, `can`, `should`, dan `show` tidak dipakai.
- Fungsi diawali `on` **hanya** bila ia handler event, pemanggil service, atau
  callback yang diteruskan lewat prop: `onSave`, `onPickPage`, `onRetry`.
- State pilihan diawali `pick`: `pickStatus`, `pickId`.
- Helper murni tidak memakai `on`. Namai dengan kata kerja biasa: `readNumber`,
  `toApiQuery`, `formatDate`. Alasannya: `on` menandai sesuatu yang dipicu dari
  luar (event, prop, service), sedangkan helper dipanggil langsung dan hasilnya
  hanya bergantung pada argumennya, sama seperti `packages/utils` di
  monorepo-apower-fe (`formatDate`, `listMonths`, `toAreaFilter`).

```ts
// SALAH
const onReadNumber = (value: string | null, fallback: number) => …;

// BENAR
const readNumber = (value: string | null, fallback: number) => …;
```

**[WAJIB-3] Urutan di dalam komponen: state → function → useEffect → return.**
Berlaku juga untuk custom hook. "State" mencakup semua hook yang mengembalikan
nilai (`useState`, `useBoolean`, `useForm`, `useQuery`, `useRef`, …) dan nilai
turunannya; `useEffect` berderet tepat sebelum `return`. Tidak ditegakkan lint, jadi
diperiksa saat review (checklist pedoman-slicing §6).

**[WAJIB-4] State boolean lewat `useBoolean()`**, bukan `useState<boolean>`
atau `const [isX] = useState(…)` (keduanya ditegakkan lint).

**[WAJIB-5] Loading.**

- Satu `isLoading` per layar untuk operasi yang dijalankan tangan.
- Nyalakan dengan `onTrue()` sebelum `try`, matikan dengan `onFalse()` di
  `finally`, bukan `onToggle()`.
- Data yang diambil TanStack Query memakai status query-nya sendiri; jangan
  disalin ke state.
- Form RHF: `isSubmitting` adalah flag loading-nya; jangan ditambah `useBoolean`.

**[WAJIB-6] `onConfirm` hanya membuka dialog.**
Ia tidak `async` dan tidak memanggil service. Yang menyimpan adalah `onSave` /
`onDelete`, dipanggil dari tombol dialog.

**[WAJIB-7] Tanpa state turunan.**
Nilai yang bisa dihitung dari props, state, atau data query dihitung saat render,
bukan disimpan lewat `useState` + `useEffect`.

**[WAJIB-8] Barrel `index.ts` per folder.**
Setiap folder komponen dan fitur punya `index.ts` yang mengekspor isinya. Impor
dari luar folder memakai barrel:

```ts
import { DataList, ListToolbar } from "@/components/common/list";
import { JemaatListScreen } from "@/features/kejemaatan/daftar-jemaat/list";
```

Barrel akar fitur hanya mengekspor yang dipakai di luar fitur. Fitur yang layarnya
ada di `list/` dan `form/` tidak punya barrel akar; rute mengimpor sub-barrel
layarnya, supaya rute Daftar tidak ikut memuat form. `package.json` memuat
`"sideEffects": ["*.css"]` agar ekspor barrel yang tak terpakai dibuang dari bundel.

Di dalam fitur yang sama dan di dalam satu kelompok `components/common`, impor
relatif ke berkasnya (`../api`, `./data-table`) — mengimpor barrel folder sendiri
menimbulkan impor melingkar. Impor dalam ke folder lain ditolak lint.

Tidak ikut barrel, diimpor langsung, karena server-only: `components/layout/app-shell`,
`features/auth/get-session`, `features/auth/refresh`. Barrel ikut masuk bundel klien
begitu ada komponen klien yang mengimpornya.

**[WAJIB-9] Bahasa.**
Nama di kode (variabel, fungsi, tipe, berkas) berbahasa Inggris, kecuali istilah
domain yang sudah menjadi nama di be-sada (`jemaat`, `keluarga`, `wilayah`,
`typeJemaat`). Teks yang dibaca user berbahasa Indonesia baku. Pesan validasi satu
klausa tanpa titik (`Nama wajib diisi`); pesan yang memuat lebih dari satu klausa
diakhiri titik (`Kecamatan wajib dipilih, sesudah kabupaten/kota.`).

**[WAJIB-10] Layar tidak menulis breakpoint, warna mentah, atau `components/ui/*`**
(ditegakkan lint). Tata letak responsif milik `components/layout` dan
`components/common`.

**[WAJIB-11] Satu berkas satu komponen di `features/**`.**
Nama berkas kebab-case dari nama komponennya (`IdentitySection` →
`identity-section.tsx`). Komponen yang sekelompok jadi satu folder dengan barrel
(`beranda/widgets/office/`); hook, konstanta, dan helper yang dipakai lebih dari
satu komponen di folder itu tinggal di satu berkas non-komponen (`data.ts`,
`section.ts`). Konfigurasi yang merender JSX tapi bukan komponen (`jemaatTable`)
boleh menumpang di berkas komponen yang memakainya.

Pengecualian di `components/**`: kerangka bersama yang komponennya saling terkait
dan selalu dipakai bersama boleh tetap satu berkas, mis. `form-layout.tsx`
(`FormLayout`, `FormSection`, `FormActions`), `data-list.tsx`, dan primitif
`components/ui` bawaan shadcn.

**[WAJIB-12] Bentuk komponen: arrow function + `interface PropTypes`.**
Mengikuti monorepo-apower-fe. Props dibongkar di baris pertama badan, bukan di
parameter:

```tsx
interface PropTypes {
  form: JemaatForm;
  isDisabled: boolean;
}

export const IdentitySection = (props: PropTypes) => {
  const { form, isDisabled } = props;
  …
};
```

- Satu `PropTypes` per berkas (WAJIB-11 menjamin satu komponen per berkas).
  Props turunan elemen memakai `extends`:
  `interface PropTypes extends ComponentProps<"textarea"> {}`; sisa props diberi
  nama `rest`, karena `props` sudah dipakai.
- Ekspor bernama (`export const`), bukan `export default`: barrel memakai
  `export *`, yang tidak membawa ekspor default.
- Hook dan helper tetap boleh `function` biasa; aturan ini untuk komponen.
- Di luar aturan ini, dengan alasannya: `components/ui/*` (bentuk bawaan shadcn,
  ditimpa lagi saat `shadcn add`), dan berkas `components/**` yang berisi beberapa
  komponen (pengecualian WAJIB-11) karena satu berkas tidak bisa memuat dua
  `PropTypes`.

**[WAJIB-13] Handler inline paling banyak 2 statement** (ditegakkan lint).
Lebih dari itu, pindahkan ke `const onX = …` di blok fungsi (sebelum `useEffect`
dan `return`), lalu teruskan namanya: `onBack={onBack}`. Callback ref yang bukan
handler dinamai kata kerja biasa (`setCursorNode`).

## Yang dipertahankan

- Test bersebelahan dengan berkas yang diuji (`x.test.ts`).
- Struktur `features/<domain>/<fitur>/` dengan `api.ts`, `model.ts`, `types.ts`,
  `list/`, `form/` — bukan `containers/`, `services/`, `types/`. Lihat
  `../docs/design/frontend-structure.md`.
- Batas lapisan impor (`eslint-plugin-boundaries`): `app → features → shared`,
  fitur tidak mengimpor fitur lain kecuali sesi di `features/auth`.
- `lib/security`, `lib/api`, `proxy.ts`, dan `features/observability` tetap di
  tempatnya; alasan keamanannya dicatat di `../docs/decisions/fe-kode/`.
