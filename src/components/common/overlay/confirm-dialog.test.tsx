import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";
import { type ComponentProps } from "react";

import { useBoolean } from "@/hooks/use-boolean";

import { ConfirmDialog } from "./confirm-dialog";

afterEach(cleanup);

type Extra = Partial<ComponentProps<typeof ConfirmDialog>>;

const Harness = (props: Extra) => {
  const isOpen = useBoolean(true);

  return (
    <ConfirmDialog
      isOpen={isOpen.value}
      onOpenChange={isOpen.setValue}
      title="Tambah pekerjaan baru?"
      description="“Tukang Las” belum ada di daftar."
      confirmLabel="Tambahkan"
      onConfirm={() => {}}
      {...props}
    />
  );
};

const isClosed = () => {
  const dialog = screen.queryByRole("alertdialog");

  return dialog === null || dialog.hasAttribute("data-closed");
};

describe("ConfirmDialog", () => {
  test("children tampil di bawah deskripsi", () => {
    render(
      <Harness>
        <p role="alert">Nama Pekerjaan minimal 2 karakter</p>
      </Harness>,
    );

    expect(screen.getByRole("alert").textContent).toBe(
      "Nama Pekerjaan minimal 2 karakter",
    );
  });

  test("isPending menonaktifkan kedua tombol dan menandai konfirmasi sibuk", () => {
    render(<Harness isPending isClosedOnConfirm={false} />);

    const confirm = screen.getByRole("button", { name: "Tambahkan" });

    expect(confirm.hasAttribute("disabled")).toBe(true);
    expect(confirm.getAttribute("aria-busy")).toBe("true");
    expect(
      screen.getByRole("button", { name: "Batal" }).hasAttribute("disabled"),
    ).toBe(true);
  });

  test("isClosedOnConfirm=false: dialog tetap terbuka sesudah konfirmasi", () => {
    const onConfirm = mock();
    render(<Harness isClosedOnConfirm={false} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "Tambahkan" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(isClosed()).toBe(false);
  });

  test("bawaan: dialog tertutup sesudah konfirmasi", () => {
    const onConfirm = mock();
    render(<Harness onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "Tambahkan" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(isClosed()).toBe(true);
  });
});
