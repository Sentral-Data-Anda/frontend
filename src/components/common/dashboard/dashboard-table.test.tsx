import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { DashboardTable, TableTitle } from "./dashboard-table";

afterEach(cleanup);

const renderTable = () =>
  render(
    <DashboardTable
      label="Perlu diselesaikan"
      columns={[
        { label: "Item", width: "2.3fr" },
        { label: "Nominal", width: "1fr", align: "right" },
      ]}
      rows={[
        {
          key: "KK-12",
          href: "/keuangan/kas-keluar",
          label: "KK-12 · Konsumsi retret",
          cells: [
            <TableTitle key="t" title="KK-12 · Konsumsi retret" />,
            "Rp 4,5 jt",
          ],
          compact: { title: "KK-12 · Konsumsi retret", trailing: "Rp 4,5 jt" },
        },
        {
          key: "PST-1",
          label: "PST-1",
          cells: ["PST-1", "—"],
          compact: { title: "PST-1" },
        },
      ]}
    />,
  );

test("tabel lebar: kepala kolom + satu baris per data; baris bertautan satu target", () => {
  renderTable();

  const table = screen.getByRole("table", { name: "Perlu diselesaikan" });
  expect(
    within(table)
      .getAllByRole("columnheader")
      .map((h) => h.textContent),
  ).toEqual(["Item", "Nominal"]);
  expect(within(table).getAllByRole("row")).toHaveLength(3);
  expect(
    within(table)
      .getByRole("link", { name: "KK-12 · Konsumsi retret" })
      .getAttribute("href"),
  ).toBe("/keuangan/kas-keluar");
  expect(within(table).getAllByRole("link")).toHaveLength(1);
});

test("bentuk ringkas (< 40rem) ikut dirender sebagai daftar; teks terpotong punya title", () => {
  renderTable();

  const list = screen.getByRole("list", { name: "Perlu diselesaikan" });
  expect(within(list).getAllByRole("listitem")).toHaveLength(2);
  expect(
    screen.getAllByText("KK-12 · Konsumsi retret")[0].getAttribute("title"),
  ).toBe("KK-12 · Konsumsi retret");
});
