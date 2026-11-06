import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { CompletenessIndicator } from "./completeness-indicator";

afterEach(cleanup);

const onRender = (
  props: Partial<Parameters<typeof CompletenessIndicator>[0]> = {},
) =>
  render(
    <CompletenessIndicator
      missingFields={["ethnicGroupId", "codeInduk"]}
      editHref="/kejemaatan/daftar-jemaat/edit/abc"
      {...props}
    />,
  );

const trigger = () =>
  screen.getByRole("button", {
    name: "Tidak Lengkap: Suku, Kode induk",
  });

describe("CompletenessIndicator", () => {
  test("baris lengkap menampilkan kata Lengkap, bukan ikon", () => {
    onRender({ missingFields: [] });

    expect(screen.getByText("Lengkap")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  test("baris kurang menampilkan kata Tidak Lengkap dengan nama aksesibel", () => {
    onRender();

    const button = trigger();

    expect(button.textContent).toBe("Tidak Lengkap");
    // Ikon lingkaran kuning sudah tidak dipakai lagi di kolom ini.
    expect(button.querySelector("svg")).toBeNull();
  });

  test("hover memunculkan tooltip berisi field yang kurang", async () => {
    onRender();

    const button = trigger();

    await act(async () => {
      fireEvent.pointerEnter(button, { pointerType: "mouse" });
      fireEvent.mouseEnter(button);
      fireEvent.mouseMove(button);
    });

    const tooltip = await screen.findByRole("dialog", {
      name: "Data belum lengkap",
    });

    expect(screen.getByText("Suku")).toBeTruthy();
    expect(screen.getByText("Kode induk")).toBeTruthy();
    expect(tooltip).toBeTruthy();
  });

  test("klik membuka tooltip yang sama plus tautan lengkapi", async () => {
    onRender();

    const button = trigger();

    await act(async () => {
      fireEvent.click(button);
    });

    await screen.findByRole("dialog", { name: "Data belum lengkap" });

    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(
      screen.getByRole("link", { name: "Lengkapi data" }).getAttribute("href"),
    ).toBe("/kejemaatan/daftar-jemaat/edit/abc");
  });

  test("Escape menutup dan fokus kembali ke pemicu", async () => {
    onRender();

    const button = trigger();

    await act(async () => {
      fireEvent.click(button);
    });

    const tooltip = await screen.findByRole("dialog", {
      name: "Data belum lengkap",
    });

    await act(async () => {
      fireEvent.keyDown(tooltip, { key: "Escape" });
    });

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(button);
  });

  test("tanpa izin ubah, tidak ada tautan lengkapi", async () => {
    onRender({ editHref: null });

    await act(async () => {
      fireEvent.click(trigger());
    });

    await screen.findByRole("dialog", { name: "Data belum lengkap" });
    expect(screen.queryByRole("link", { name: "Lengkapi data" })).toBeNull();
  });
});
