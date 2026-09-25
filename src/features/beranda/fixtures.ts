export const SHOW_DUMMY = process.env.NODE_ENV !== "production";

export type Notification = {
  id: string;
  title: string;
  body: string;
  timeLabel: string;
  isRead: boolean;
};

export const DUMMY_NOTIFICATIONS: Notification[] = [
  {
    id: "kas-keluar-menunggu",
    title: "Persetujuan kas keluar menunggu",
    body: "Rp 4.500.000 untuk konsumsi Natal Anak",
    timeLabel: "10 menit lalu",
    isRead: false,
  },
  {
    id: "jadwal-pelayan-kosong",
    title: "Jadwal pelayan belum lengkap",
    body: "Ibadah Minggu II: pemusik belum terisi",
    timeLabel: "1 jam lalu",
    isRead: false,
  },
  {
    id: "pengumuman-baru",
    title: "Pengumuman baru",
    body: "Rapat majelis Kamis pukul 19.00 di ruang konsistori",
    timeLabel: "Kemarin",
    isRead: true,
  },
];

export type BudgetUse = {
  id: string;
  commission: string;
  budget: number;
  used: number;
};

export const DUMMY_BUDGET_USE: BudgetUse[] = [
  {
    id: "b1",
    commission: "Komisi Pemuda",
    budget: 60_000_000,
    used: 51_600_000,
  },
  {
    id: "b2",
    commission: "Komisi Musik",
    budget: 25_000_000,
    used: 21_250_000,
  },
  {
    id: "b3",
    commission: "Komisi Wanita",
    budget: 40_000_000,
    used: 22_000_000,
  },
  { id: "b4", commission: "Komisi Anak", budget: 30_000_000, used: 9_300_000 },
];

export const DUMMY_ZONES = [
  { id: "w1", name: "Wilayah I", count: 312 },
  { id: "w2", name: "Wilayah II", count: 241 },
  { id: "w3", name: "Wilayah III", count: 198 },
  { id: "w4", name: "Wilayah IV", count: 174 },
  { id: "w5", name: "Wilayah V", count: 216 },
  { id: "w6", name: "Wilayah VI", count: 149 },
];

export const DUMMY_NEW_MEMBERS = [
  {
    id: "n1",
    name: "Keluarga Sitompul",
    note: "Atestasi masuk",
    date: "2026-09-14",
  },
  {
    id: "n2",
    name: "Gabriella Panggabean",
    note: "Baptis dewasa",
    date: "2026-09-07",
  },
  {
    id: "n3",
    name: "Keluarga Nababan",
    note: "Atestasi masuk",
    date: "2026-09-02",
  },
];

export const DUMMY_UNPOSTED_OFFERINGS = {
  title: "Persembahan 14–21 Sep",
  count: 23,
};

export const DUMMY_CASH_ACCOUNTS = [
  { id: "kas", name: "Kas besar", amount: 18_200_000 },
  { id: "bca", name: "BCA giro", amount: 214_000_000 },
  { id: "mandiri", name: "Mandiri", amount: 80_200_000 },
];

export const DUMMY_CASH_RUNWAY_MONTHS = 4.1;

export const DUMMY_CLOSING_CHECKS = [
  { id: "unposted", label: "23 persembahan belum diposting", isReady: false },
  { id: "settings", label: "Setelan akuntansi lengkap", isReady: true },
];
