import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { RowActionsProvider } from "@/components/common/list";

import type { JemaatListItem } from "../types";

import { JemaatListItemRow, jemaatTable } from "./list-item";

afterEach(cleanup);

const JEMAAT: JemaatListItem = {
  id: 1,
  publicId: "11111111-2222-4333-8444-555555555555",
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
    <RowActionsProvider
      value={jemaatTable(isCanUpdate).getRowActions?.(JEMAAT)}
    >
      <ul>
        <JemaatListItemRow jemaat={JEMAAT} />
      </ul>
    </RowActionsProvider>,
  );

describe("gate aksi Ubah per baris", () => {
  test("dengan UPDATE: tautan ubah menunjuk rute kode jemaat", () => {
    onRenderRow(true);

    const action = screen.getByRole("link", { name: "Ubah Maria Sitompul" });
    expect(action.getAttribute("href")).toBe(
      "/kejemaatan/daftar-jemaat/edit/11111111-2222-4333-8444-555555555555",
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
