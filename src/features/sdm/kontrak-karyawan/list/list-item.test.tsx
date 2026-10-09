import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import type { KontrakKaryawan } from "../types";

import { kontrakTable } from "./list-item";

/**
 * Konfigurasi tabel diuji langsung, bukan lewat layar: `onStubViewport(true)`
 * tetap merender baris HP, jadi tujuh kolom ini nol cakupan sampai ada yang
 * memanggilnya sendiri.
 */
const CONTRACT: KontrakKaryawan = {
  id: 1,
  publicId: "ktr-1",
  code: "KTR-0003",
  karyawanId: 3,
  contractType: "PARUH_WAKTU",
  position: "Bendahara Kantor",
  basicSalary: "9999999999999.00",
  effectiveFrom: "2026-03-01T00:00:00.000Z",
  effectiveTo: "2026-12-31T00:00:00.000Z",
  weeklyDayOff: [1],
  note: null,
  karyawan: { publicId: "kry-3", code: "KRY-0003", name: "Citra Halim" },
};

const OPEN: KontrakKaryawan = {
  ...CONTRACT,
  effectiveTo: null,
  weeklyDayOff: [],
};

const ACROSS_YEARS: KontrakKaryawan = {
  ...CONTRACT,
  effectiveTo: "2027-05-11T00:00:00.000Z",
};

const cellOf = (key: string, contract: KontrakKaryawan) => {
  const column = kontrakTable(true).columns.find((item) => item.key === key);

  if (!column) throw new Error(`kolom ${key} tidak ada`);

  return render(<div>{column.cell(contract)}</div>).container;
};

afterEach(cleanup);

describe("konfigurasi kolom", () => {
  test("tujuh kolom, urutan dan judulnya", () => {
    expect(kontrakTable(false).columns.map((column) => column.key)).toEqual([
      "karyawan",
      "position",
      "code",
      "contractType",
      "basicSalary",
      "effectiveFrom",
      "phase",
    ]);
  });

  test("semua kolom data proporsional, nol yang dikunci rem", () => {
    for (const column of kontrakTable(true).columns) {
      expect(column.width, column.key).toContain("fr)");
      expect(column.width, column.key).toContain("minmax(0,");
    }
  });

  test("hanya Jenis yang pelengkap, dan uang rata kanan", () => {
    const columns = kontrakTable(true).columns;

    expect(
      columns.filter((column) => column.isSecondary).map((c) => c.key),
    ).toEqual(["contractType"]);
    expect(columns.find((c) => c.key === "basicSalary")?.align).toBe("end");
  });

  test("tautan baris hanya dengan UPDATE", () => {
    expect(kontrakTable(true).getRowHref?.(CONTRACT)).toBe(
      "/hr/employee-contract/KTR-0003/ubah",
    );
    expect(kontrakTable(false).getRowHref?.(CONTRACT)).toBeUndefined();
    expect(kontrakTable(true).getRowLabel?.(CONTRACT)).toBe(
      "Ubah kontrak Citra Halim",
    );
  });
});

/**
 * Sub menu ini nol halaman detail, jadi sel yang terpotong tanpa `title`
 * adalah nilai yang TIDAK BISA dilihat penuh di mana pun — dan nominal uang
 * yang terpotong terbaca sebagai angka lain yang lebih kecil.
 */
describe("setiap sel yang bisa terpotong punya nilai penuhnya", () => {
  test("nominal gaji membawa nilai penuhnya", () => {
    const cell = cellOf("basicSalary", CONTRACT);

    expect(cell.querySelector("[title]")?.getAttribute("title")).toBe(
      "Rp 9.999.999.999.999",
    );
  });

  test("rentang berlaku membawa tanggal panjangnya", () => {
    const cell = cellOf("effectiveFrom", CONTRACT);

    expect(cell.querySelector("[title]")?.getAttribute("title")).toBe(
      "1 Maret 2026 – 31 Desember 2026",
    );
  });

  test("jenis kontrak membawa labelnya", () => {
    const cell = cellOf("contractType", CONTRACT);

    expect(cell.querySelector("[title]")?.getAttribute("title")).toBe(
      "Paruh waktu",
    );
  });

  test("nama dan jabatan tetap membawanya", () => {
    expect(
      cellOf("karyawan", CONTRACT)
        .querySelector("[title]")
        ?.getAttribute("title"),
    ).toBe("Citra Halim");
    expect(
      cellOf("position", CONTRACT)
        .querySelector("[title]")
        ?.getAttribute("title"),
    ).toBe("Bendahara Kantor");
  });
});

describe("rentang berlaku di kolom sempit", () => {
  test("tahun yang sama tidak diulang", () => {
    expect(cellOf("effectiveFrom", CONTRACT).textContent).toBe(
      "1 Mar – 31 Des 2026",
    );
  });

  test("tahun yang berbeda ditulis dua-duanya", () => {
    expect(cellOf("effectiveFrom", ACROSS_YEARS).textContent).toBe(
      "1 Mar 2026 – 11 Mei 2027",
    );
  });

  test("tanpa tanggal akhir dibaca terbuka, bukan tanggal karangan", () => {
    expect(cellOf("effectiveFrom", OPEN).textContent).toBe("Sejak 1 Mar 2026");
  });
});

describe("penanda libur mingguan kosong", () => {
  test("muncul hanya saat lariknya kosong", () => {
    expect(cellOf("karyawan", OPEN).textContent).toContain(
      "Libur mingguan belum diisi",
    );
    expect(cellOf("karyawan", CONTRACT).textContent).not.toContain(
      "Libur mingguan belum diisi",
    );
  });
});
