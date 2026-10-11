import { describe, expect, test } from "bun:test";

import { csvCell, csvFileName, toCsv } from "./csv";

describe("csvCell", () => {
  test("angka memakai koma desimal, seperti yang dibaca Excel Indonesia", () => {
    expect(csvCell(1250.5)).toBe("1250,5");
    expect(csvCell(0)).toBe("0");
  });

  test("teks dikutip dan kutipnya digandakan", () => {
    expect(csvCell('Toko "Rejeki"')).toBe('"Toko ""Rejeki"""');
  });

  // Tanpa ini Excel memangkas 0101 jadi 101, dan berkas pemeriksaan kode akun
  // justru menampilkan kode yang bukan miliknya.
  test("nol di depan dipertahankan", () => {
    expect(csvCell("0101")).toBe('"=""0101"""');
  });

  test("kode bercampur huruf dibiarkan apa adanya", () => {
    expect(csvCell("1-100")).toBe('"1-100"');
    expect(csvCell("BKM-2026-0001")).toBe('"BKM-2026-0001"');
  });
});

describe("toCsv", () => {
  const columns = [
    { header: "Kode", value: (row: { code: string }) => row.code },
  ];

  test("diawali BOM supaya Excel membaca UTF-8", () => {
    expect(toCsv(columns, [])).toStartWith("﻿");
  });

  test("kolom dipisah titik koma, baris dipisah CRLF", () => {
    const csv = toCsv(
      [...columns, { header: "Jumlah", value: () => 1500 }],
      [{ code: "A" }, { code: "B" }],
    );

    expect(csv).toBe('﻿"Kode";"Jumlah"\r\n"A";1500\r\n"B";1500');
  });
});

describe("csvFileName", () => {
  test("spasi dan tanda baca tidak ikut ke nama berkas", () => {
    expect(csvFileName(["Kas Masuk", "Oktober 2026"])).toBe(
      "Kas-Masuk_Oktober-2026.csv",
    );
  });

  test("bagian kosong dibuang", () => {
    expect(csvFileName(["Neraca", ""])).toBe("Neraca.csv");
  });
});

// Mengutip tidak menolong: Excel membuang kutipnya lalu menjalankan isinya,
// dan keterangan maupun referensi semuanya diketik pengguna.
describe("csvCell menolak rumus", () => {
  test("teks berawalan pemicu rumus dijadikan teks", () => {
    expect(csvCell("=1+1")).toBe('"\'=1+1"');
    expect(csvCell("+62812")).toBe('"\'+62812"');
    expect(csvCell("-SUM(A1)")).toBe('"\'-SUM(A1)"');
    expect(csvCell("@SUM(A1)")).toBe('"\'@SUM(A1)"');
    expect(csvCell("\tSUM(A1)")).toBe('"\'\tSUM(A1)"');
  });

  test("teks biasa tidak disentuh", () => {
    expect(csvCell("Sewa gedung")).toBe('"Sewa gedung"');
    expect(csvCell("BA-07/IX/2026")).toBe('"BA-07/IX/2026"');
  });

  // Angka lewat jalur angka, jadi nilai negatif tetap bisa dijumlahkan Excel.
  test("angka negatif tetap angka", () => {
    expect(csvCell(-5000)).toBe("-5000");
  });
});
