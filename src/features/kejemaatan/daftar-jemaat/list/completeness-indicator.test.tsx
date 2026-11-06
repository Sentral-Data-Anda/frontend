import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
} from "bun:test";

import { onStubViewport } from "../../../../../tests/viewport";

import { CompletenessIndicator } from "./completeness-indicator";

let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(true);
});
afterAll(() => viewport.onRestore());
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

const openButton = () =>
  screen.getByRole("button", {
    name: "Data belum lengkap: Suku, Kode induk",
  });

describe("CompletenessIndicator desktop", () => {
  test("baris lengkap menampilkan label kecil, bukan ikon", () => {
    onRender({ missingFields: [], isCompleteLabelVisible: true });

    expect(screen.getByText("Lengkap")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: /Data belum lengkap/ }),
    ).toBeNull();
  });

  test("baris lengkap tanpa label tidak merender apa pun", () => {
    const { container } = onRender({ missingFields: [] });

    expect(container.innerHTML).toBe("");
  });

  test("ikon punya nama aksesibel dan ringkasan hover", () => {
    onRender();

    const button = openButton();

    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(button.getAttribute("title")).toBe(
      "Belum lengkap: Suku, Kode induk",
    );
  });

  test("klik membuka daftar field dan tautan lengkapi", async () => {
    onRender();

    const button = openButton();

    await act(async () => {
      fireEvent.click(button);
    });

    const dialog = await screen.findByRole("dialog", {
      name: "Data belum lengkap",
    });

    expect(screen.getByText("Suku")).toBeTruthy();
    expect(screen.getByText("Kode induk")).toBeTruthy();
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(
      screen.getByRole("link", { name: "Lengkapi data" }).getAttribute("href"),
    ).toBe("/kejemaatan/daftar-jemaat/edit/abc");
    expect(dialog).toBeTruthy();
  });

  test("Escape menutup dan fokus kembali ke tombol", async () => {
    onRender();

    const button = openButton();

    await act(async () => {
      fireEvent.click(button);
    });

    const dialog = await screen.findByRole("dialog", {
      name: "Data belum lengkap",
    });

    await act(async () => {
      fireEvent.keyDown(dialog, { key: "Escape" });
    });

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(button);
  });

  test("tanpa izin ubah, tidak ada tautan lengkapi", async () => {
    onRender({ editHref: null });

    await act(async () => {
      fireEvent.click(openButton());
    });

    await screen.findByRole("dialog", { name: "Data belum lengkap" });
    expect(screen.queryByRole("link", { name: "Lengkapi data" })).toBeNull();
  });
});

describe("CompletenessIndicator mobile", () => {
  test("ikon membuka bottom sheet dan tombol Tutup menutupnya", async () => {
    const mobile = onStubViewport(false);

    try {
      onRender();

      await act(async () => {
        fireEvent.click(openButton());
      });

      expect(
        screen.getByRole("dialog", { name: "Data belum lengkap" }),
      ).toBeTruthy();
      expect(screen.getByText("Suku")).toBeTruthy();

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Tutup" }));
      });

      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    } finally {
      mobile.onRestore();
    }
  });
});
