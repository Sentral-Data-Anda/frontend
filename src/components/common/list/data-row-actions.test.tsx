import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, jest, test } from "bun:test";

import { DataRowActions, type RowActions } from "./data-row-actions";

afterEach(cleanup);

const actions = (patch: Partial<RowActions> = {}): RowActions => ({
  label: "Wilayah I",
  edit: { href: "/kejemaatan/wilayah/edit/w1", label: "Ubah Wilayah I" },
  remove: { onSelect: () => {}, label: "Hapus Wilayah I" },
  ...patch,
});

describe("tombol aksi di ujung baris", () => {
  test("Ubah adalah tautan ke rute edit, Hapus adalah tombol — bukan tautan", () => {
    render(<DataRowActions actions={actions()} />);

    const edit = screen.getByRole("link", { name: "Ubah Wilayah I" });
    expect(edit.getAttribute("href")).toBe("/kejemaatan/wilayah/edit/w1");

    // Menghapus tidak boleh berupa navigasi: ia membuka dialog konfirmasi.
    expect(screen.queryByRole("link", { name: /Hapus/ })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Hapus Wilayah I" }),
    ).toBeTruthy();
  });

  test("tanpa aksi apa pun, tidak merender apa-apa (bukan tombol kosong)", () => {
    const { container } = render(
      <DataRowActions
        actions={{ label: "Wilayah I", edit: undefined, remove: undefined }}
      />,
    );

    expect(container.innerHTML).toBe("");
  });

  test("tanpa izin hapus: tombol Hapus tidak ada, Ubah tetap ada", () => {
    render(<DataRowActions actions={actions({ remove: undefined })} />);

    expect(screen.getByRole("link", { name: "Ubah Wilayah I" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Hapus/ })).toBeNull();
  });

  test("tanpa izin ubah: tidak ada tautan ubah walau href kosong", () => {
    // Daftar menyiapkan `edit` dengan href `undefined` bila tak berhak.
    render(
      <DataRowActions
        actions={actions({
          edit: { href: undefined, label: "Ubah Wilayah I" },
        })}
      />,
    );

    expect(screen.queryByRole("link", { name: /Ubah/ })).toBeNull();
  });

  test("Hapus memanggil onSelect sekali dan tidak berpindah halaman", () => {
    const onSelect = jest.fn();
    render(
      <DataRowActions
        actions={actions({
          remove: { onSelect, label: "Hapus Wilayah I" },
        })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Hapus Wilayah I" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  test("Ubah memanggil onNavigate (menyimpan fokus daftar) sebelum pindah", () => {
    const onNavigate = jest.fn();
    render(
      <DataRowActions
        actions={actions({
          edit: { href: "/x/edit/1", onNavigate, label: "Ubah Wilayah I" },
        })}
      />,
    );

    fireEvent.click(screen.getByRole("link", { name: "Ubah Wilayah I" }));

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  test("tanpa label sendiri, label dirangkai dari kata kerja dan nama baris", () => {
    render(
      <DataRowActions
        actions={{
          label: "Satuan Lusin",
          edit: { href: "/x/edit/1" },
          remove: { onSelect: () => {} },
        }}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Ubah Satuan Lusin" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Hapus Satuan Lusin" }),
    ).toBeTruthy();
  });
});

describe("layar sempit: satu tombol titik-tiga", () => {
  test("membuka sheet berisi Ubah dan Hapus; Hapus menutup sheet lalu memanggil onSelect", () => {
    const onSelect = jest.fn();
    render(
      <DataRowActions
        actions={actions({ remove: { onSelect, label: "Hapus Wilayah I" } })}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Tindakan untuk Wilayah I" }),
    );

    // Dua tombol "Hapus Wilayah I" kini ada: satu di baris, satu di sheet.
    const sheetDelete = screen
      .getAllByRole("button", { name: "Hapus Wilayah I" })
      .at(-1) as HTMLElement;
    fireEvent.click(sheetDelete);

    expect(onSelect).toHaveBeenCalledTimes(1);
    // Sheet ditutup: tinggal tombol di baris.
    expect(
      screen.getAllByRole("button", { name: "Hapus Wilayah I" }),
    ).toHaveLength(1);
  });

  test("judul sheet hanya memuat nama, tanpa kata kerja warisan 'Ubah …'", () => {
    render(<DataRowActions actions={actions({ label: "Ubah Wilayah I" })} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Tindakan untuk Ubah Wilayah I" }),
    );

    const dialog = screen.getByRole("dialog", { hidden: true });
    expect(within(dialog).getByText("Wilayah I")).toBeTruthy();
    expect(within(dialog).queryByText("Ubah Wilayah I")).toBeNull();
  });
});
