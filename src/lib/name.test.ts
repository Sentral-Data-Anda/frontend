import { describe, expect, test } from "bun:test";

import { findSimilar, normalizeName } from "./name";

describe("normalizeName (identik dengan be-sada)", () => {
  test.each([
    ["  petani   sawit ", "Petani Sawit"],
    ["PNS", "PNS"],
    ["pelajar/mahasiswa", "Pelajar/Mahasiswa"],
    ["batak-toba", "Batak-Toba"],
    ["guru (honorer)", "Guru (Honorer)"],
    ["McDonald karyawan", "McDonald Karyawan"],
    ["pns/ASN", "pns/ASN"],
    ["", ""],
  ])("%p menjadi %p", (input, expected) => {
    expect(normalizeName(input)).toBe(expected);
  });
});

describe("findSimilar", () => {
  const OPTIONS = [
    { value: "1", label: "Petani" },
    { value: "2", label: "Pelajar/mahasiswa" },
    { value: "3", label: "Wiraswasta" },
    { value: "4", label: "PNS/ASN" },
    { value: "5", label: "Guru" },
  ];

  const labelsOf = (text: string) =>
    findSimilar(OPTIONS, text).map((option) => option.label);

  test("sama setelah huruf kecil dan tanpa spasi/tanda baca", () => {
    expect(labelsOf("pelajar mahasiswa")).toEqual(["Pelajar/mahasiswa"]);
  });

  test("salah satu memuat yang lain, minimal 3 huruf", () => {
    expect(labelsOf("petani sawit")).toEqual(["Petani"]);
    expect(labelsOf("pns")).toEqual(["PNS/ASN"]);
    expect(labelsOf("gu")).toEqual([]);
  });

  test("salah ketik sampai 2 huruf untuk kata minimal 4 huruf", () => {
    expect(labelsOf("wiraswata")).toEqual(["Wiraswasta"]);
    expect(labelsOf("gurh")).toEqual(["Guru"]);
    expect(labelsOf("tukang las")).toEqual([]);
  });

  test("paling banyak 3 saran, yang paling mirip dulu", () => {
    const many = [
      { value: "1", label: "Petani kopi" },
      { value: "2", label: "Petani sawit" },
      { value: "3", label: "Petani karet" },
      { value: "4", label: "Petani" },
    ];

    expect(findSimilar(many, "petani").map((option) => option.value)).toEqual([
      "4",
      "1",
      "2",
    ]);
  });

  test("teks kosong tidak menyarankan apa pun", () => {
    expect(labelsOf("  ")).toEqual([]);
  });
});
