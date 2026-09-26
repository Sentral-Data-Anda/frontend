import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import type { RiwayatJemaat } from "../types";

import { RiwayatListItemRow, riwayatTable } from "./list-item";

afterEach(cleanup);

const RIWAYAT: RiwayatJemaat = {
  id: "0b5f3c2e-7d41-4c6a-9e2f-000000000001",
  type: "BAPTIS",
  typeLabel: "Baptis",
  date: "1990-06-17T00:00:00.000Z",
  certificateNumber: "BPT/1990/014",
  place: null,
  jemaat: { code: "JMT-0001", name: "Andreas Sitanggang" },
};

const onRenderRow = (isCanUpdate: boolean, riwayat = RIWAYAT) =>
  render(
    <ul>
      <RiwayatListItemRow riwayat={riwayat} isCanUpdate={isCanUpdate} />
    </ul>,
  );

describe("baris HP", () => {
  test("judul nama jemaat, meta jenis · tanggal, trailing nomor surat", () => {
    onRenderRow(false);

    expect(screen.getByText("Andreas Sitanggang")).toBeTruthy();
    expect(screen.getByText("Baptis · 17 Juni 1990")).toBeTruthy();
    expect(screen.getByText("BPT/1990/014")).toBeTruthy();
  });

  test("tanpa nomor surat: trailing kosong", () => {
    onRenderRow(false, { ...RIWAYAT, certificateNumber: null });

    expect(screen.queryByText("BPT/1990/014")).toBeNull();
  });

  test("dengan UPDATE: tautan ubah menunjuk rute publicId", () => {
    onRenderRow(true);

    const action = screen.getByRole("link", {
      name: "Ubah riwayat baptis Andreas Sitanggang",
    });
    expect(action.getAttribute("href")).toBe(
      `/kejemaatan/riwayat-jemaat/${RIWAYAT.id}/ubah`,
    );
  });

  test("tanpa UPDATE: tidak ada aksi ubah", () => {
    onRenderRow(false);

    expect(screen.queryByRole("link")).toBeNull();
  });

  test("baris membawa id supaya bisa disorot saat kembali", () => {
    onRenderRow(true);

    expect(
      document.querySelector(`[data-row-id="${RIWAYAT.id}"]`),
    ).not.toBeNull();
  });
});

describe("konfigurasi tabel", () => {
  test("kolom sesuai brief, kolom sekunder hanya kode, no. surat, tempat", () => {
    const columns = riwayatTable(true).columns;

    expect(columns.map((column) => [column.header, column.width])).toEqual([
      ["Jemaat", "minmax(0,2fr)"],
      ["Kode jemaat", "minmax(0,1fr)"],
      ["Jenis", "minmax(0,1fr)"],
      ["Tanggal", "minmax(0,1fr)"],
      ["No. surat", "minmax(0,1fr)"],
      ["Tempat", "minmax(0,1.5fr)"],
    ]);
    expect(
      columns
        .filter((column) => column.isSecondary)
        .map((column) => column.key),
    ).toEqual(["jemaatCode", "certificateNumber", "place"]);
  });

  test("baris tabel hanya bisa dibuka dengan UPDATE", () => {
    expect(riwayatTable(false).getRowHref).toBeUndefined();
    expect(riwayatTable(true).getRowHref?.(RIWAYAT)).toBe(
      `/kejemaatan/riwayat-jemaat/${RIWAYAT.id}/ubah`,
    );
  });
});
