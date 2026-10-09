import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import type { UserListItem } from "../types";

import { UserListItemRow, userTable } from "./list-item";

afterEach(cleanup);

const USER: UserListItem = {
  publicId: "p",
  code: "USR-0007",
  username: "A-0007",
  status: "PENDING",
  lastLogin: null,
  roleUser: { id: 3, name: "Operator Sistem" },
  jemaat: { id: 7, code: "JMT-0007", name: "Gabriel Tampubolon" },
};

describe("baris HP", () => {
  test("judul nama jemaat, meta username · role, status Belum aktif", () => {
    render(
      <ul>
        <UserListItemRow user={USER} />
      </ul>,
    );

    expect(screen.getByText("Gabriel Tampubolon")).toBeTruthy();
    expect(screen.getByText("A-0007 · Operator Sistem")).toBeTruthy();
    expect(screen.getByText("Belum aktif")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Buka akun Gabriel Tampubolon" })
        .getAttribute("href"),
    ).toBe("/settings/user/USR-0007/ubah");
    expect(document.querySelector('[data-row-id="USR-0007"]')).not.toBeNull();
  });
});

describe("konfigurasi tabel", () => {
  test("kolom sesuai brief; terakhir masuk hanya di tabel lebar", () => {
    expect(userTable.columns.map((column) => column.header)).toEqual([
      "Nama",
      "Username",
      "Role",
      "Status",
      "Terakhir masuk",
    ]);
    expect(
      userTable.columns
        .filter((column) => column.isSecondary)
        .map((column) => column.key),
    ).toEqual(["lastLogin"]);
    expect(userTable.getRowHref?.(USER)).toBe("/settings/user/USR-0007/ubah");
  });

  test("belum pernah masuk tertulis, bukan kosong", () => {
    const lastLogin = userTable.columns.find(
      (column) => column.key === "lastLogin",
    );

    render(<div>{lastLogin?.cell(USER)}</div>);

    expect(screen.getByText("Belum pernah")).toBeTruthy();
  });
});
