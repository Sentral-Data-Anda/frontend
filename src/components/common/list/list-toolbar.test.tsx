import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";
import type { ComponentProps } from "react";

import type { ListFilter } from "./list-filter";
import { ListToolbar } from "./list-toolbar";

afterEach(cleanup);

const FILTERS: ListFilter[] = [
  {
    key: "wilayah",
    label: "Wilayah",
    kind: "select",
    options: [
      { value: "", label: "Semua wilayah" },
      { value: "2", label: "Wilayah II" },
    ],
  },
  {
    key: "status",
    label: "Status",
    kind: "choice",
    options: [
      { value: "", label: "Semua" },
      { value: "AKTIF", label: "Aktif" },
      { value: "TIDAK_AKTIF", label: "Tidak aktif" },
    ],
  },
];

type ListParams = ComponentProps<typeof ListToolbar>["listParams"];

const onRenderToolbar = (
  values: { status?: string; wilayah?: string } = {},
  filters: ListFilter[] = FILTERS,
) => {
  const listParams: ListParams = {
    search: "",
    status: values.status ?? "",
    filters: { wilayah: values.wilayah ?? "" },
    onSearch: mock(),
    onApplyFilters: mock(),
    onClearFilters: mock(),
  };

  render(
    <ListToolbar
      listParams={listParams}
      searchLabel="Cari jemaat"
      searchPlaceholder="Cari nama"
      filters={filters}
    />,
  );

  return listParams;
};

const openPanel = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /^Filter/ }));
  });

  return screen.getByRole("dialog", { name: "Filter" });
};

describe("ListToolbar", () => {
  test("tanpa filter: hanya kotak cari, tanpa tombol Filter", () => {
    onRenderToolbar({}, []);

    expect(screen.getByRole("searchbox", { name: "Cari jemaat" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Filter/ })).toBeNull();
  });

  test("badge menghitung filter aktif selain cari dan terbaca", () => {
    onRenderToolbar({ status: "AKTIF", wilayah: "2" });

    expect(
      screen.getByRole("button", { name: "Filter, 2 aktif" }),
    ).toBeTruthy();
  });

  test("tanpa filter aktif: tanpa badge dan tanpa label filter", () => {
    onRenderToolbar();

    expect(screen.getByRole("button", { name: "Filter" })).toBeTruthy();
    expect(screen.queryByRole("list", { name: "Filter aktif" })).toBeNull();
  });

  test("perubahan di panel adalah draf; URL ditulis hanya saat Terapkan", async () => {
    const listParams = onRenderToolbar({ wilayah: "2" });

    await openPanel();
    fireEvent.click(screen.getByRole("radio", { name: "Tidak aktif" }));

    expect(listParams.onApplyFilters).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Terapkan" }));
    });

    expect(listParams.onApplyFilters).toHaveBeenCalledWith({
      wilayah: "2",
      status: "TIDAK_AKTIF",
    });
  });

  test("Reset mengosongkan draf ke bawaan tanpa menulis URL", async () => {
    const listParams = onRenderToolbar({ status: "AKTIF", wilayah: "2" });

    await openPanel();
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(listParams.onApplyFilters).not.toHaveBeenCalled();
    expect(
      (screen.getByRole("radio", { name: "Semua" }) as HTMLInputElement)
        .checked,
    ).toBe(true);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Terapkan" }));
    });

    expect(listParams.onApplyFilters).toHaveBeenCalledWith({
      wilayah: "",
      status: "",
    });
  });

  test("tutup tanpa Terapkan membuang draf", async () => {
    const listParams = onRenderToolbar({ status: "AKTIF" });

    const panel = await openPanel();
    fireEvent.click(screen.getByRole("radio", { name: "Tidak aktif" }));
    await act(async () => {
      fireEvent.keyDown(panel, { key: "Escape" });
    });
    await openPanel();

    expect(listParams.onApplyFilters).not.toHaveBeenCalled();
    expect(
      (screen.getByRole("radio", { name: "Aktif" }) as HTMLInputElement)
        .checked,
    ).toBe(true);
  });

  test("label filter aktif menghapus satu filter", () => {
    const listParams = onRenderToolbar({ status: "AKTIF", wilayah: "2" });

    fireEvent.click(
      screen.getByRole("button", { name: "Hapus filter Wilayah: Wilayah II" }),
    );

    expect(listParams.onApplyFilters).toHaveBeenCalledWith({ wilayah: "" });
  });

  test("Hapus semua hanya tampil untuk dua filter atau lebih", () => {
    const listParams = onRenderToolbar({ status: "AKTIF", wilayah: "2" });

    fireEvent.click(screen.getByRole("button", { name: "Hapus semua" }));

    expect(listParams.onClearFilters).toHaveBeenCalledTimes(1);

    cleanup();
    onRenderToolbar({ status: "AKTIF" });

    expect(
      screen.getByRole("button", { name: "Hapus filter Status: Aktif" }),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Hapus semua" })).toBeNull();
  });
});
