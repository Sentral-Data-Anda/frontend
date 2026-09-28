import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

import { todayJakarta } from "@/lib/date";
import type { MenuAction } from "@/types/menu";

import { ASSET } from "../../../../../../scripts/mock/inventaris-store";
import {
  assetIdOf,
  onStubCycleFetch,
  renderWithClient,
  restoreCycleStore,
  type Call,
} from "../../fixtures";
import { CYCLE_LIST_PATH } from "../../model";

const actions: { current: MenuAction[] } = { current: [] };
const search = { current: new URLSearchParams() };
const replaced: string[] = [];
const calls: Call[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => `${CYCLE_LIST_PATH}/pindah/baru`,
  useSearchParams: () => search.current,
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: actions.current.includes("VIEW"),
    isCanCreate: actions.current.includes("CREATE"),
    isCanUpdate: actions.current.includes("UPDATE"),
    isCanDelete: actions.current.includes("DELETE"),
  }),
}));

const { TransferFormScreen } = await import("./screen");

let onRestoreFetch: () => void;

beforeEach(() => {
  onRestoreFetch = onStubCycleFetch(calls);
});

afterEach(() => {
  cleanup();
  onRestoreFetch();
  restoreCycleStore();
  window.sessionStorage.clear();
  replaced.length = 0;
  calls.length = 0;
});

const KAMERA = "Kamera Canon EOS M50";

const onRender = (granted: MenuAction[], barang = "") => {
  actions.current = granted;
  search.current = new URLSearchParams(barang ? { barang } : {});

  return renderWithClient(<TransferFormScreen />);
};

const onPick = async (label: string, option: string) => {
  fireEvent.click(screen.getByLabelText(label));
  const item = await screen.findByRole("option", { name: option });
  fireEvent.pointerDown(item);
  fireEvent.click(item);
};

const onSaveConfirmed = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
  fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
};

describe("pindahkan barang", () => {
  test("tanpa CREATE: tidak merender form", () => {
    onRender(["VIEW"]);

    expect(screen.getByText("Tidak bisa memindahkan barang")).toBeTruthy();
  });

  test("?barang= mengisi barang, lokasi sekarang, dan tujuan; tujuan sama ditolak FE", async () => {
    const code = ASSET.find((row) => row.name === KAMERA)?.code ?? "";

    onRender(["VIEW", "CREATE"], code);

    expect(
      await screen.findByText("Gedung Gereja · Komisi Pemuda"),
    ).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByLabelText("Ruang tujuan").textContent).toContain(
        "Gedung Gereja",
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(
      await screen.findByText(
        "Pilih ruang atau badan pelayanan yang berbeda dari lokasi sekarang",
      ),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Ya" })).toBeNull();
  });

  test("pindah badan pelayanan saja → POST, kembali ke tab pindah + sorotan", async () => {
    const code = ASSET.find((row) => row.name === KAMERA)?.code ?? "";

    onRender(["VIEW", "CREATE"], code);
    await screen.findByText("Gedung Gereja · Komisi Pemuda");
    await onPick("Badan pelayanan tujuan", "Majelis Jemaat");
    await onSaveConfirmed();

    await waitFor(() => expect(replaced).toHaveLength(1));
    expect(calls.find((call) => call.method === "POST")?.body).toEqual({
      assetId: assetIdOf(KAMERA),
      toRoomId: 1,
      toBapelId: 1,
      transferDate: todayJakarta(),
    });
    expect(replaced[0]).toBe(`${CYCLE_LIST_PATH}?jenis=pindah`);
    expect(
      window.sessionStorage.getItem(`list-focus:${CYCLE_LIST_PATH}`),
    ).toMatch(/^SKA-/);
  });
});
