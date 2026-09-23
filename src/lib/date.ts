/**
 * Tanggal kalender sebagai STRING, bukan `Date`.
 *
 * Seluruh tanggal di SADA (`birthDate`, `joinedAt`, tanggal riwayat) adalah
 * *calendar date*: "12 Mei 1990" adalah 12 Mei di Sabang maupun Merauke, dan
 * tidak pernah punya jam maupun zona waktu. `lib/format.ts` sudah menjelaskan
 * jebakannya panjang lebar — `new Date("1990-05-12")` di zona mana pun di
 * sebelah barat UTC menggeser harinya ke 11 Mei.
 *
 * Karena itu berkas ini bekerja di atas string `YYYY-MM-DD` dan **tidak
 * pernah memanggil `new Date`** untuk menghitung apa pun. Satu-satunya tempat
 * `Date` dipakai adalah `todayJakarta()`, yang memang harus bertanya "sekarang
 * tanggal berapa" kepada jam sistem — dan ia segera mengubahnya jadi string.
 *
 * Kontrak: `docs/design/date-input.md §7.2` dan `§7.9`.
 */

/** Hasil penguraian ketikan: tanggal yang sah, atau pesan yang bisa ditampilkan. */
export type ParsedDate =
  { iso: string; error?: never } | { iso?: never; error: string };

/**
 * Pesan galat dipatok di sini, bukan di layar (`date-input.md §7.7`), supaya
 * dua form tidak menjelaskan kesalahan yang sama dengan dua kalimat berbeda.
 */
export const DATE_ERROR = {
  invalid: "Tanggal tidak ada. Contoh: 12/05/1990.",
  shortYear: "Tulis empat angka, mis. 1990.",
} as const;

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Aturan Gregorian penuh, bukan `year % 4`: 1900 bukan kabisat, 2000 kabisat. */
const isLeapYear = (year: number): boolean =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const daysInMonth = (month: number, year: number): number =>
  month === 2 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[month - 1];

const pad = (value: number): string => String(value).padStart(2, "0");

/**
 * Hari, bulan, tahun → `YYYY-MM-DD`, atau `null` bila tanggalnya tidak ada.
 *
 * Inilah yang menolak 31 Februari tanpa bantuan `Date` — `new Date(1990, 1, 31)`
 * justru DIAM-DIAM menggesernya ke 3 Maret, dan pergeseran itu tersimpan ke
 * database sebagai tanggal yang tidak pernah diketik siapa pun.
 */
export function toIsoDate(
  day: number,
  month: number,
  year: number,
): string | null {
  if (!Number.isInteger(day) || !Number.isInteger(month)) return null;
  if (!Number.isInteger(year)) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(month, year)) return null;

  return `${String(year).padStart(4, "0")}-${pad(month)}-${pad(day)}`;
}

/** `YYYY-MM-DD` → `dd/mm/yyyy`; nilai kosong atau cacat → string kosong. */
export function toInputText(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());

  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
}

/**
 * Ketikan petugas → `YYYY-MM-DD`.
 *
 * Satu bentuk yang DITAMPILKAN (`dd/mm/yyyy`), tapi penguraian yang memaafkan:
 * pemisah apa pun, angka satuan tanpa nol di depan, dan delapan angka
 * beruntun. Yang TIDAK dimaafkan adalah tahun dua digit — "12/05/90" bisa
 * berarti 1990 atau 2090, dan data jemaat kita menyeberangi 1900-an.
 *
 * String kosong bukan galat: field tanggal boleh dikosongkan, dan yang
 * memutuskan wajib atau tidak adalah skema form, bukan pengurai ini.
 */
export function parseDateInput(text: string): ParsedDate {
  const trimmed = text.trim();

  if (!trimmed) return { iso: "" };

  const digitsOnly = /^\d{8}$/.exec(trimmed);

  if (digitsOnly) {
    const iso = toIsoDate(
      Number(trimmed.slice(0, 2)),
      Number(trimmed.slice(2, 4)),
      Number(trimmed.slice(4, 8)),
    );

    return iso ? { iso } : { error: DATE_ERROR.invalid };
  }

  const parts = trimmed.split(/[^\d]+/).filter(Boolean);

  if (parts.length !== 3) return { error: DATE_ERROR.invalid };

  const [day, month, year] = parts;

  // Tahun diperiksa SEBELUM tanggalnya: "12/05/90" harus berkata "tulis empat
  // angka", bukan "tanggal tidak ada" — yang kedua menyuruh user membetulkan
  // bagian yang sudah benar.
  if (year.length !== 4) return { error: DATE_ERROR.shortYear };
  if (day.length > 2 || month.length > 2) return { error: DATE_ERROR.invalid };

  const iso = toIsoDate(Number(day), Number(month), Number(year));

  return iso ? { iso } : { error: DATE_ERROR.invalid };
}

const jakartaDateFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Hari ini di WIB sebagai `YYYY-MM-DD`.
 *
 * `en-CA` bukan pilihan estetis: locale itu memang memformat tanggal sebagai
 * `YYYY-MM-DD`, jadi tidak ada perakitan string sendiri yang bisa salah urut.
 * Zona dipatok Asia/Jakarta supaya petugas yang laptopnya masih ber-zona lain
 * tidak melihat "hari ini" yang berbeda dari rekannya.
 */
export const todayJakarta = (now: Date = new Date()): string =>
  jakartaDateFormat.format(now);

/**
 * Umur dalam tahun penuh, dihitung sebagai KALENDER — bukan selisih milidetik
 * dibagi 365,25. Indonesia tanpa DST, tapi pembagian itu tetap meleset satu
 * hari di sekitar tahun kabisat, dan yang meleset adalah angka yang dibaca
 * petugas di baris konfirmasi.
 *
 * `today` diterima sebagai parameter supaya bisa diuji tanpa membekukan jam
 * sistem; bawaannya hari ini di WIB.
 */
export function ageInYears(
  birthIso: string,
  today: string = todayJakarta(),
): number | null {
  const birth = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthIso.trim());
  const now = /^(\d{4})-(\d{2})-(\d{2})$/.exec(today.trim());

  if (!birth || !now) return null;

  let age = Number(now[1]) - Number(birth[1]);

  // Belum ulang tahun di tahun ini → kurangi satu. Perbandingan string
  // `MM-DD` aman karena keduanya selalu dua digit bernol depan.
  if (`${now[2]}-${now[3]}` < `${birth[2]}-${birth[3]}`) age -= 1;

  return age < 0 ? null : age;
}

/**
 * Aritmetika kalender.
 *
 * Di sini `Date` DIPAKAI, dan itu aman justru karena caranya: selalu
 * `Date.UTC(...)` dengan tiga angka, tidak pernah mem-parse string tanggal.
 * Yang berbahaya dan dilarang di seluruh repo adalah `new Date("1990-05-12")`
 * — parsing string yang hasilnya bergantung zona waktu pembaca. Membangun
 * momen UTC dari angka lalu membacanya kembali dengan `getUTC*` bebas dari
 * pergeseran itu, dan menghemat menulis ulang algoritma hari-Julian sendiri.
 */
const toUtc = (iso: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());

  return match
    ? new Date(
        Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
      )
    : null;
};

const fromUtc = (date: Date): string =>
  `${String(date.getUTCFullYear()).padStart(4, "0")}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

/** Geser sejumlah hari; nilai cacat menghasilkan string kosong. */
export function addDays(iso: string, days: number): string {
  const date = toUtc(iso);

  if (!date) return "";

  date.setUTCDate(date.getUTCDate() + days);

  return fromUtc(date);
}

/**
 * Geser sejumlah bulan, **menjepit** tanggalnya ke akhir bulan tujuan.
 *
 * 31 Januari + 1 bulan = 28/29 Februari, bukan 3 Maret. Bawaan `setUTCMonth`
 * melimpahkan kelebihannya ke bulan berikutnya, dan di kalender itu terlihat
 * sebagai bulan yang dilewati saat menekan panah.
 */
export function addMonths(iso: string, months: number): string {
  const date = toUtc(iso);

  if (!date) return "";

  const day = date.getUTCDate();
  const target = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1),
  );
  const lastDay = daysInMonth(
    target.getUTCMonth() + 1,
    target.getUTCFullYear(),
  );

  target.setUTCDate(Math.min(day, lastDay));

  return fromUtc(target);
}

/** Hari pertama bulan yang memuat `iso`. */
export const startOfMonth = (iso: string): string =>
  /^(\d{4})-(\d{2})/.test(iso.trim()) ? `${iso.slice(0, 7)}-01` : "";

/** 0 = Senin … 6 = Minggu — pekan Indonesia dimulai Senin (`date-input.md §7.5`). */
export function weekdayIndex(iso: string): number {
  const date = toUtc(iso);

  if (!date) return -1;

  return (date.getUTCDay() + 6) % 7;
}

/**
 * Enam pekan × tujuh hari yang memuat bulan `iso`, selalu 42 sel.
 *
 * Jumlahnya dipatok supaya tinggi kalender tidak berubah saat bulan berganti
 * — kisi yang melompat satu baris membuat tombol di bawahnya berpindah tepat
 * saat user hendak menekannya.
 */
export function monthGrid(iso: string): string[] {
  const first = startOfMonth(iso);

  if (!first) return [];

  const start = addDays(first, -weekdayIndex(first));

  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

/** Apakah `iso` berada di dalam bulan yang sama dengan `monthIso`. */
export const isSameMonth = (iso: string, monthIso: string): boolean =>
  iso.slice(0, 7) === monthIso.slice(0, 7);

/** `iso` di dalam rentang (batas ikut dihitung); batas kosong = tanpa batas. */
export const isWithin = (iso: string, min?: string, max?: string): boolean =>
  (!min || iso >= min) && (!max || iso <= max);
