import { expect, test } from "bun:test";

import type { TugasSayaItem } from "../../api";

import { toTaskRows } from "./data";

const item = (patch: Partial<TugasSayaItem> = {}): TugasSayaItem => ({
  date: "2026-10-04T00:00:00.000Z",
  startTime: "07:30",
  endTime: "10:00",
  jadwal: { code: "JDL_0001-2026-0002", name: "Pelayan Ibadah Minggu I" },
  bapel: { name: "Majelis Jemaat" },
  role: { name: "Liturgis" },
  musikSkill: null,
  group: null,
  ibadah: [],
  ...patch,
});

test("baris: tugas, tanggal-jam, nama jadwal bila tanpa ibadah", () => {
  const [row] = toTaskRows([item()], "2026-09-28", true);

  expect(row).toMatchObject({
    title: "Liturgis",
    when: "Minggu 4 Okt 2026 · 07.30–10.00",
    where: "Pelayan Ibadah Minggu I · Majelis Jemaat",
    group: null,
    isToday: false,
  });
});

test("baris: alat musik, ibadah tertaut pertama, kelompok, hari ini", () => {
  const [row] = toTaskRows(
    [
      item({
        role: { name: "Pemusik" },
        musikSkill: { name: "Gitar" },
        group: { name: "Band Pemuda" },
        ibadah: [
          { code: "IBD-1", typeIbadah: { name: "Ibadah Pemuda" } },
          { code: "IBD-2", typeIbadah: { name: "Ibadah Lain" } },
        ],
      }),
    ],
    "2026-10-04",
    true,
  );

  expect(row).toMatchObject({
    title: "Pemusik · Gitar",
    where: "Ibadah Pemuda · Majelis Jemaat",
    group: "Band Pemuda",
    isToday: true,
  });
});

test("tautan ke halaman baca jadwal hanya dengan VIEW Jadwal Pelayan", () => {
  expect(toTaskRows([item()], "2026-09-28", true)[0].href).toBe(
    "/pelayanan/jadwal-pelayan/JDL_0001-2026-0002",
  );
  expect(toTaskRows([item()], "2026-09-28", false)[0].href).toBeUndefined();
});

test("kunci baris unik walau satu jadwal memuat dua tugas", () => {
  const keys = toTaskRows([item(), item()], "2026-09-28", false).map(
    (row) => row.key,
  );

  expect(new Set(keys).size).toBe(2);
});
