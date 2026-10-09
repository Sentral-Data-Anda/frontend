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
  usePathname: () => `${CYCLE_LIST_PATH}/pelepasan/baru`,
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

const { DisposalFormScreen } = await import("./screen");

let onRestoreFetch: () => void;

beforeEach(() => {
  onRestoreFetch = onStubCycleFetch(calls);
});

afterEach(() => {
  cleanup();
  onRestoreFetch();
  restoreCycleStore();
  delete process.env.MOCK_DISPOSAL_NO_WORKFLOW;
  replaced.length = 0;
  calls.length = 0;
});

const KAMERA = "Kamera Canon EOS M50";

const onRender = (granted: MenuAction[], barang = "") => {
  actions.current = granted;
  search.current = new URLSearchParams(barang ? { barang } : {});

  return renderWithClient(<DisposalFormScreen />);
};

const onPick = async (label: string, option: string) => {
  fireEvent.click(screen.getByLabelText(label));
  const item = await screen.findByRole("option", { name: option });
  fireEvent.pointerDown(item);
  fireEvent.click(item);
};

const onFill = async () => {
  const code = ASSET.find((row) => row.name === KAMERA)?.code ?? "";

  onRender(["VIEW", "DELETE"], code);
  await waitFor(() =>
    expect((screen.getByLabelText("Barang") as HTMLInputElement).value).toBe(
      KAMERA,
    ),
  );
  await onPick("Cara", "Dijual");
  fireEvent.change(screen.getByLabelText("Alasan"), {
    target: { value: "Diganti kamera baru" },
  });
};

const onSubmit = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Ajukan" }));
  return screen.findByRole("button", { name: "Ya" });
};

describe("ajukan pelepasan", () => {
  test("tanpa VIEW: keadaan tanpa akses, bukan pesan peran", () => {
    onRender([]);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Asset Transaction"),
    ).toBeTruthy();
    expect(screen.queryByText(/Peran Anda/)).toBeNull();
  });

  test("tanpa DELETE: tidak merender form", () => {
    onRender(["VIEW", "CREATE"]);

    expect(
      screen.getByText("Tidak bisa mengajukan pelepasan barang"),
    ).toBeTruthy();
  });

  test("?barang= mengisi awal; Dijual tanpa hasil ditolak FE", async () => {
    await onFill();
    fireEvent.click(screen.getByRole("button", { name: "Ajukan" }));

    expect(
      await screen.findByText(
        "Hasil penjualan wajib diisi untuk barang yang dijual",
      ),
    ).toBeTruthy();
    expect(calls.some((call) => call.method === "POST")).toBe(false);
  });

  test("konfirmasi jenis hapus; sukses → halaman pelepasan", async () => {
    await onFill();
    fireEvent.change(screen.getByLabelText("Hasil penjualan (Rp)"), {
      target: { value: "1.500.000" },
    });

    const yes = await onSubmit();
    expect(
      screen.getByText(/bila disetujui, pelepasan tidak bisa dibatalkan/),
    ).toBeTruthy();
    expect(yes.className).toContain("destructive");
    fireEvent.click(yes);

    await waitFor(() => expect(replaced).toHaveLength(1));
    expect(calls.find((call) => call.method === "POST")?.body).toEqual({
      assetId: assetIdOf(KAMERA),
      method: "SOLD",
      disposalDate: todayJakarta(),
      reason: "Diganti kamera baru",
      proceeds: 1500000,
    });
    expect(replaced[0]).toMatch(
      new RegExp(`^${CYCLE_LIST_PATH}/pelepasan/SKA-\\d{4}-\\d{4}$`),
    );
  });

  test("tanpa alur persetujuan → FormAlert + kalimat untuk admin", async () => {
    process.env.MOCK_DISPOSAL_NO_WORKFLOW = "1";
    await onFill();
    fireEvent.change(screen.getByLabelText("Hasil penjualan (Rp)"), {
      target: { value: "1000" },
    });
    fireEvent.click(await onSubmit());

    expect(
      await screen.findByText(
        "Belum Ada Alur Persetujuan Untuk Dokumen Dengan Nominal Ini",
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Setelan Alur Persetujuan" }),
    ).toBeTruthy();
    expect(replaced).toEqual([]);
  });
});
