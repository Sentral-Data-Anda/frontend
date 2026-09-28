import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import type { MenuAction } from "@/types/menu";

import { galeriEditHref } from "../model";
import type { Album } from "../types";

const actions: { current: MenuAction[] } = { current: [] };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/kegiatan/galeri/ALBM_0002-0001",
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: actions.current.includes("VIEW"),
    isCanCreate: actions.current.includes("CREATE"),
    isCanUpdate: actions.current.includes("UPDATE"),
    isCanDelete: actions.current.includes("DELETE"),
  }),
}));

const { GaleriDetailScreen } = await import("./screen");

const originalFetch = globalThis.fetch;
const CODE = "ALBM_0002-0001";

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

const ALBUM: Album = {
  code: CODE,
  name: "Retret Pemuda 2025",
  isPublish: false,
  bapel: { id: 2, code: "BPL-2", name: "Komisi Pemuda" },
  listImage: ["Api unggun", "Foto bersama", "Sesi pagi"].map((name, index) => ({
    publicId: `p-${index}`,
    name,
    mimeType: "image/jpeg",
    size: 1,
    showOnWebsite: index < 2,
    url: `http://media/${index}.jpg`,
  })),
};

const onRender = (granted: MenuAction[], response?: Response) => {
  actions.current = granted;
  globalThis.fetch = (async () =>
    response ??
    Response.json({
      status: 200,
      message: "Berhasil Mendapatkan Album",
      data: ALBUM,
    })) as unknown as typeof fetch;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <GaleriDetailScreen code={CODE} />
    </QueryClientProvider>,
  );
};

const dialogOf = (container: HTMLElement) =>
  container.querySelector("dialog") as HTMLDialogElement;

describe("halaman album", () => {
  test("tanpa VIEW: keadaan tanpa akses, tanpa memuat", () => {
    onRender([]);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Galeri"),
    ).toBeTruthy();
  });

  test("album draf menjelaskan dua kunci website; Ubah hanya dengan UPDATE", async () => {
    onRender(["VIEW"]);

    expect(
      await screen.findByText(
        "2 dari 3 foto dicentang, tetapi baru tampil di website sesudah album terbit.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Draf")).toBeTruthy();
    expect(screen.getAllByText("Website")).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "Ubah" })).toBeNull();

    cleanup();
    onRender(["VIEW", "UPDATE"]);

    expect(
      (await screen.findByRole("link", { name: "Ubah" })).getAttribute("href"),
    ).toBe(galeriEditHref(CODE));
  });

  test("404: data album tidak ditemukan", async () => {
    onRender(
      ["VIEW"],
      Response.json(
        { status: 404, error: "Album Tidak Ditemukan" },
        { status: 404 },
      ),
    );

    expect(await screen.findByText("Data album tidak ditemukan")).toBeTruthy();
  });
});

describe("penampil foto", () => {
  test("panah berpindah dan berhenti di ujung; tutup mengembalikan fokus ke foto pemicu", async () => {
    const { container } = onRender(["VIEW"]);
    const trigger = await screen.findByRole("button", {
      name: "Buka foto Foto bersama, 2 dari 3",
    });

    fireEvent.click(trigger);

    const dialog = dialogOf(container);
    await waitFor(() => expect(dialog.open).toBe(true));
    expect(screen.getByText("2 / 3")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Foto bersama" })).toBeTruthy();

    fireEvent.keyDown(dialog, { key: "ArrowRight" });
    expect(screen.getByText("3 / 3")).toBeTruthy();
    fireEvent.keyDown(dialog, { key: "ArrowRight" });
    expect(screen.getByText("3 / 3")).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: /Berikutnya/ }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    fireEvent.keyDown(dialog, { key: "ArrowLeft" });
    fireEvent.keyDown(dialog, { key: "ArrowLeft" });
    expect(screen.getByText("1 / 3")).toBeTruthy();

    dialog.close();
    fireEvent(dialog, new Event("close"));

    await waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(screen.queryByText("1 / 3")).toBeNull();
  });

  test("gambar gagal dimuat: penampil memakai keadaan gagal MediaThumb", async () => {
    const { container } = onRender(["VIEW"]);

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Buka foto Api unggun, 1 dari 3",
      }),
    );

    const dialog = dialogOf(container);
    await waitFor(() => expect(dialog.querySelector("img")).toBeTruthy());
    fireEvent.error(dialog.querySelector("img")!);

    await waitFor(() =>
      expect(dialog.textContent).toContain(
        "Gambar Api unggun tidak dapat dimuat",
      ),
    );
  });
});
