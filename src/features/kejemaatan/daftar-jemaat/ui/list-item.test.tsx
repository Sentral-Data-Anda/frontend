import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import type { JemaatListItem } from "../types";

import { JemaatListItemRow } from "./list-item";

afterEach(cleanup);

const JEMAAT: JemaatListItem = {
  code: "JMT-0042",
  name: "Maria Sitompul",
  gender: "P",
  birthDate: "1990-05-12T00:00:00.000Z",
  type: "ANGGOTA",
  roleInFamily: "ANAK",
  keluarga: { id: 12, code: "KEL-0012", name: "Keluarga Sitompul" },
  status: "AKTIF",
  zoneChurch: { id: 2, name: "Wilayah II" },
};

const onRenderRow = (isCanUpdate: boolean) =>
  render(
    <ul>
      <JemaatListItemRow jemaat={JEMAAT} isCanUpdate={isCanUpdate} />
    </ul>,
  );

/**
 * Setengah dari test wajib 10 (bagian "+" ada di `screen`-nya). Aksi yang
 * tidak dipegang peran TIDAK ADA di DOM, bukan tampil dalam keadaan mati:
 * tombol yang terlihat tapi menolak ditekan membuat user mengira aplikasinya
 * rusak, bukan mengira dirinya tidak berhak.
 */
describe("gate aksi Ubah per baris", () => {
  test("dengan UPDATE: tautan ubah menunjuk rute kode jemaat", () => {
    onRenderRow(true);

    const action = screen.getByRole("link", { name: "Ubah Maria Sitompul" });
    expect(action.getAttribute("href")).toBe(
      "/kejemaatan/daftar-jemaat/JMT-0042/ubah",
    );
  });

  test("tanpa UPDATE: tidak ada aksi ubah sama sekali", () => {
    onRenderRow(false);

    expect(screen.queryByRole("link", { name: /Ubah/ })).toBeNull();
  });

  test("baris membawa id supaya bisa disorot saat kembali", () => {
    onRenderRow(true);

    expect(document.querySelector('[data-row-id="JMT-0042"]')).not.toBeNull();
  });
});
