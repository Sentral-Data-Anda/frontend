import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

import type { AttachmentValue } from "@/types/attachment";

import { AttachmentField } from "./attachment-field";

afterEach(cleanup);

const revoked: string[] = [];

beforeEach(() => {
  revoked.length = 0;
  let counter = 0;
  URL.createObjectURL = mock(() => `blob:local-${++counter}`);
  URL.revokeObjectURL = mock((url: string) => {
    revoked.push(url);
  });
});

const file = (name: string, type = "image/jpeg", size = 10) =>
  new File([new Uint8Array(size)], name, { type });

const server = (key: string, showOnWebsite = false): AttachmentValue => ({
  key,
  name: `${key}.jpg`,
  mimeType: "image/jpeg",
  url: `http://media/${key}.jpg`,
  showOnWebsite,
  file: null,
});

const onRender = (
  value: AttachmentValue[],
  extra: Partial<Parameters<typeof AttachmentField>[0]> = {},
) => {
  const changes: AttachmentValue[][] = [];

  const view = render(
    <AttachmentField
      id="listImage"
      label="Foto"
      value={value}
      onValueChange={(next) => changes.push(next)}
      max={4}
      accept="image"
      {...extra}
    />,
  );
  const input =
    view.container.querySelector<HTMLInputElement>("input[type=file]")!;
  const pick = (...files: File[]) =>
    fireEvent.change(input, { target: { files } });

  return { changes, input, pick };
};

describe("AttachmentField", () => {
  test("fieldset bernama label; input hanya menerima tipe yang diizinkan", () => {
    const { input } = onRender([]);

    expect(screen.getByRole("group", { name: "Foto" })).toBeTruthy();
    expect(input.accept).toBe("image/jpeg,image/png");
    expect(input.multiple).toBe(true);
  });

  test("berkas baru ditambahkan di belakang, privat secara bawaan", () => {
    const { changes, pick } = onRender([server("a")]);

    pick(file("b.jpg"));

    expect(changes[0].map((item) => item.name)).toEqual(["a.jpg", "b.jpg"]);
    expect(changes[0][1]).toMatchObject({
      showOnWebsite: false,
      url: "blob:local-1",
    });
    expect(changes[0][1].file?.name).toBe("b.jpg");
  });

  test("berkas yang ditolak tidak masuk dan pesannya tampil", () => {
    const { changes, pick } = onRender([]);

    pick(
      file("besar.jpg", "image/jpeg", 10_000_001),
      file("ok.png", "image/png"),
    );

    expect(changes[0].map((item) => item.name)).toEqual(["ok.png"]);
    expect(screen.getByText("Ukuran berkas maksimal 10 MB")).toBeTruthy();
  });

  test("melebihi max: sisanya ditolak", () => {
    const { changes, pick } = onRender([server("a"), server("b"), server("c")]);

    pick(file("d.jpg"), file("e.jpg"));

    expect(changes[0]).toHaveLength(4);
    expect(screen.getByText("Maksimal 4 berkas")).toBeTruthy();
  });

  test("penuh: tombol tambah tidak dirender", () => {
    onRender([server("a"), server("b"), server("c"), server("d")]);

    expect(screen.queryByRole("button", { name: /Tambah berkas/ })).toBeNull();
  });

  test("hapus membuang item itu saja", () => {
    const { changes } = onRender([server("a"), server("b")]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus a.jpg" }));

    expect(changes[0].map((item) => item.key)).toEqual(["b"]);
  });

  test("hapus berkas baru mencabut object URL-nya", () => {
    const { pick } = onRender([]);

    pick(file("b.jpg"));
    cleanup();

    expect(revoked).toContain("blob:local-1");
  });

  test("centang website hanya bila isWebsiteToggle, dan mengubah item itu", () => {
    const { changes } = onRender([server("a"), server("b", true)], {
      isWebsiteToggle: true,
    });

    fireEvent.click(
      screen.getByRole("checkbox", { name: /Tampil di website.*a\.jpg/ }),
    );

    expect(changes[0].map((item) => item.showOnWebsite)).toEqual([true, true]);
    expect(screen.getByText(/UU PDP/)).toBeTruthy();
  });

  test("max 1: satu berkas, tombol Ganti foto, pilihan baru mengganti", () => {
    const { changes, input, pick } = onRender([server("a")], { max: 1 });

    expect(input.multiple).toBe(false);
    expect(screen.getByRole("button", { name: /Ganti foto/ })).toBeTruthy();

    pick(file("baru.jpg"));

    expect(changes[0].map((item) => item.name)).toEqual(["baru.jpg"]);
  });

  test("galat form dirujuk fieldset dan tombol tambah tetap berid field", () => {
    onRender([], { error: "Pilih minimal satu foto" });

    const group = screen.getByRole("group", { name: "Foto" });

    expect(group.getAttribute("aria-describedby")).toBe("listImage-error");
    expect(screen.getByText("Pilih minimal satu foto").id).toBe(
      "listImage-error",
    );
    expect(screen.getByRole("button", { name: /Tambah berkas/ }).id).toBe(
      "listImage",
    );
  });
});
