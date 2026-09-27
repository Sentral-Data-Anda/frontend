import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import type { RoleUserItem } from "../types";

import { RoleUserListItemRow, roleUserTable } from "./list-item";

afterEach(cleanup);

const ROLE: RoleUserItem = {
  id: 3,
  publicId: "r3",
  name: "Operator Sistem",
  isAdmin: false,
  userCount: 2,
};

const onRenderRow = (role: RoleUserItem, isCanUpdate = false) =>
  render(
    <ul>
      <RoleUserListItemRow role={role} isCanUpdate={isCanUpdate} />
    </ul>,
  );

describe("baris HP", () => {
  test("role terbatas: meta jumlah akun", () => {
    onRenderRow(ROLE);

    expect(screen.getByText("Operator Sistem")).toBeTruthy();
    expect(screen.getByText("2 akun")).toBeTruthy();
  });

  test("role admin: meta Akses penuh", () => {
    onRenderRow({ ...ROLE, name: "Administrator", isAdmin: true });

    expect(screen.getByText("Akses penuh")).toBeTruthy();
  });

  test("tanpa userCount (be-sada lama): tanpa meta", () => {
    const { container } = onRenderRow({ ...ROLE, userCount: undefined });

    expect(container.textContent).toBe("Operator Sistem");
  });

  test("dengan UPDATE: tautan ubah menunjuk rute id angka", () => {
    onRenderRow(ROLE, true);

    expect(
      screen
        .getByRole("link", { name: "Ubah Operator Sistem" })
        .getAttribute("href"),
    ).toBe("/pengaturan/role-user/3/ubah");
    expect(document.querySelector('[data-row-id="3"]')).not.toBeNull();
  });

  test("tanpa UPDATE: tidak ada aksi ubah", () => {
    onRenderRow(ROLE);

    expect(screen.queryByRole("link")).toBeNull();
  });
});

describe("konfigurasi tabel", () => {
  test("Nama | Jenis | Akun (pelengkap)", () => {
    const table = roleUserTable(true);

    expect(table.columns.map((column) => column.header)).toEqual([
      "Nama",
      "Jenis",
      "Akun",
    ]);
    expect(
      table.columns
        .filter((column) => column.isSecondary)
        .map((column) => column.key),
    ).toEqual(["userCount"]);
    expect(table.getRowHref?.(ROLE)).toBe("/pengaturan/role-user/3/ubah");
    expect(roleUserTable(false).getRowHref).toBeUndefined();
  });
});
