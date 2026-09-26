import { describe, expect, test } from "bun:test";

import {
  addressLabel,
  birthLabel,
  offeringMeta,
  orDash,
  passwordFieldError,
  roleLabels,
  summarizeOfferings,
} from "./model";

test("pesan password lama salah dari be-sada mendarat di oldPassword", () => {
  expect(
    passwordFieldError("Password lama tidak sesuai. Periksa kembali.")?.field,
  ).toBe("oldPassword");
  expect(passwordFieldError("Kesalahan server")).toBeNull();
});

describe("persembahan dan profil", () => {
  test("ringkasan menjumlah nominal string dari be-sada", () => {
    const item = {
      code: "PSB-1",
      amount: "650000",
      period: "2026-09-01T00:00:00.000Z",
      receivedDate: "2026-09-07T00:00:00.000Z",
      typePersembahan: { name: "Persembahan Bulanan" },
    };

    expect(summarizeOfferings([item, { ...item, code: "PSB-2" }])).toEqual({
      items: [item, { ...item, code: "PSB-2" }],
      count: 2,
      total: 1_300_000,
    });
    expect(offeringMeta(item)).toBe("Periode September 2026");
    expect(offeringMeta({ ...item, period: null })).toBe(
      "Diterima 7 September 2026",
    );
  });

  test("jabatan menyebut badan pelayanannya bila ada", () => {
    expect(
      roleLabels([
        { name: "Ketua", bapel: { name: "Majelis Jemaat" } },
        { name: "Anggota", bapel: null },
      ]),
    ).toEqual(["Ketua, Majelis Jemaat", "Anggota"]);
    expect(roleLabels(undefined)).toEqual([]);
  });
});

test("profil: nilai kosong jadi —, tempat dan tanggal lahir digabung", () => {
  expect(orDash(null)).toBe("—");
  expect(orDash("  ")).toBe("—");
  expect(orDash("0812")).toBe("0812");
  expect(birthLabel("Medan", "1985-05-12T00:00:00.000Z")).toBe(
    "Medan, 12 Mei 1985",
  );
  expect(birthLabel(null, "1985-05-12T00:00:00.000Z")).toBe("12 Mei 1985");
  expect(birthLabel(null, null)).toBe("—");
});

test("alamat: jalan lalu kelurahan sampai provinsi, bagian kosong dilewati", () => {
  const named = (name: string) => ({ name });

  expect(
    addressLabel({
      address: "Jl. Merdeka No. 2",
      villages: named("Cijerah"),
      districts: named("Bandung Kulon"),
      regencies: named("Kota Bandung"),
      provinces: named("Jawa Barat"),
    }),
  ).toBe("Jl. Merdeka No. 2, Cijerah, Bandung Kulon, Kota Bandung, Jawa Barat");
  expect(
    addressLabel({
      address: "  ",
      villages: null,
      districts: null,
      regencies: named("Kota Bandung"),
      provinces: null,
    }),
  ).toBe("Kota Bandung");
  expect(
    addressLabel({
      address: null,
      villages: null,
      districts: null,
      regencies: null,
      provinces: null,
    }),
  ).toBe("—");
});
