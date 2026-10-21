import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, jest, test } from "bun:test";

import { RowDeleteDialog } from "./row-delete-dialog";

afterEach(cleanup);

const setup = (patch: Partial<Parameters<typeof RowDeleteDialog>[0]> = {}) => {
  const onCancel = jest.fn();
  const onConfirm = jest.fn();

  render(
    <RowDeleteDialog
      target={{ label: "Wilayah I" }}
      entity="wilayah"
      onCancel={onCancel}
      onConfirm={onConfirm}
      {...patch}
    />,
  );

  return { onCancel, onConfirm };
};

describe("dialog hapus baris", () => {
  test("tertutup selama tidak ada sasaran", () => {
    setup({ target: null });

    expect(screen.queryByText(/Hapus wilayah ini\?/)).toBeNull();
  });

  test("menyebut apa yang dihapus dan bahwa itu tak bisa dibatalkan", () => {
    setup();

    expect(screen.getByText("Hapus wilayah ini?")).toBeTruthy();
    expect(
      screen.getByText(
        "Wilayah I akan dihapus. Tindakan ini tidak bisa dibatalkan.",
      ),
    ).toBeTruthy();
  });

  test("Hapus memanggil onConfirm — dan tidak menutup dialog sendiri", () => {
    const { onConfirm, onCancel } = setup();

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    // Penutupan adalah urusan pemanggil, setelah server menjawab; bila ditutup
    // di sini, penolakan server tidak punya tempat untuk dibaca.
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByText("Hapus wilayah ini?")).toBeTruthy();
  });

  test("Batal memanggil onCancel dan tidak menghapus", () => {
    const { onConfirm, onCancel } = setup();

    fireEvent.click(screen.getByRole("button", { name: "Batal" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test("penolakan server tampil di dalam dialog yang tetap terbuka", () => {
    setup({
      errorMessage:
        "Wilayah Tidak Dapat Dihapus Karena Masih Digunakan oleh Keluarga",
    });

    expect(screen.getByRole("alert").textContent).toBe(
      "Wilayah Tidak Dapat Dihapus Karena Masih Digunakan oleh Keluarga",
    );
    expect(screen.getByText("Hapus wilayah ini?")).toBeTruthy();
  });

  test("tanpa galat, tidak ada alert", () => {
    setup();

    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("selama menunggu server, tombol berganti teks dan terkunci", () => {
    setup({ isPending: true });

    const button = screen.getByRole("button", {
      name: "Menghapus…",
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
