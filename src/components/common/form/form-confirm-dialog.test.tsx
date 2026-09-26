import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import { FormConfirmDialog } from "./form-confirm-dialog";
import { useFormConfirm } from "./use-form-confirm";

afterEach(cleanup);

interface PropTypes {
  isDirty?: boolean;
  onSave: () => void;
  onLeave: () => void;
  onDelete: () => void;
}

const Harness = (props: PropTypes) => {
  const { isDirty = false, onSave, onLeave, onDelete } = props;
  const confirm = useFormConfirm();

  return (
    <>
      <button type="button" onClick={() => confirm.onOpen("save")}>
        Simpan
      </button>
      <button type="button" onClick={() => confirm.onOpen("update")}>
        Simpan perubahan
      </button>
      <button type="button" onClick={() => confirm.onOpen("delete")}>
        Hapus
      </button>
      <button type="button" onClick={() => confirm.onCancel(isDirty, onLeave)}>
        Batal
      </button>

      <FormConfirmDialog
        confirm={confirm}
        noun="jemaat"
        onSave={onSave}
        onLeave={onLeave}
        onDelete={onDelete}
      />
    </>
  );
};

const onRender = (isDirty = false) => {
  const handlers = { onSave: mock(), onLeave: mock(), onDelete: mock() };

  render(<Harness isDirty={isDirty} {...handlers} />);

  return handlers;
};

const onOpen = async (trigger: string, question: string) => {
  fireEvent.click(screen.getByRole("button", { name: trigger }));

  const dialog = await screen.findByRole("alertdialog");

  await waitFor(() => expect(dialog.textContent).toContain(question));
  expect(dialog.textContent).toContain("Konfirmasi Tindakan");

  return dialog;
};

const isClosed = () => {
  const dialog = screen.queryByRole("alertdialog");

  return dialog === null || dialog.hasAttribute("data-closed");
};

describe("standar konfirmasi form", () => {
  test("simpan: Ya menjalankan onSave", async () => {
    const handlers = onRender();

    await onOpen("Simpan", "Apakah Anda ingin menyimpan data jemaat ini?");
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    expect(handlers.onSave).toHaveBeenCalledTimes(1);
    expect(handlers.onLeave).not.toHaveBeenCalled();
  });

  test("update: teks perubahan, Ya menjalankan onSave", async () => {
    const handlers = onRender();

    await onOpen(
      "Simpan perubahan",
      "Apakah Anda ingin menyimpan perubahan data jemaat ini?",
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    expect(handlers.onSave).toHaveBeenCalledTimes(1);
  });

  test("hapus: Ya bernada destructive dan menjalankan onDelete", async () => {
    const handlers = onRender();

    await onOpen("Hapus", "Apakah Anda ingin menghapus data jemaat ini?");
    const yes = screen.getByRole("button", { name: "Ya" });

    expect(yes.className).toContain("text-destructive");
    fireEvent.click(yes);

    expect(handlers.onDelete).toHaveBeenCalledTimes(1);
    expect(handlers.onSave).not.toHaveBeenCalled();
  });

  test("batal saat isian berubah: bertanya dulu, Ya menjalankan onLeave", async () => {
    const handlers = onRender(true);

    await onOpen(
      "Batal",
      "Apakah Anda ingin membatalkan? Perubahan yang belum disimpan akan hilang.",
    );
    expect(handlers.onLeave).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    expect(handlers.onLeave).toHaveBeenCalledTimes(1);
  });

  test("batal saat isian belum disentuh: langsung kembali tanpa dialog", () => {
    const handlers = onRender(false);

    fireEvent.click(screen.getByRole("button", { name: "Batal" }));

    expect(handlers.onLeave).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  test("fokus awal di Tidak; Tidak tidak menjalankan aksi", async () => {
    const handlers = onRender();

    await onOpen("Hapus", "menghapus");
    await waitFor(() =>
      expect(document.activeElement?.textContent).toBe("Tidak"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Tidak" }));

    expect(isClosed()).toBe(true);
    expect(handlers.onDelete).not.toHaveBeenCalled();
  });

  test("Escape tidak menjalankan aksi", async () => {
    const handlers = onRender(true);

    const dialog = await onOpen("Batal", "membatalkan");

    await act(async () => fireEvent.keyDown(dialog, { key: "Escape" }));

    expect(isClosed()).toBe(true);
    expect(handlers.onLeave).not.toHaveBeenCalled();
  });
});
