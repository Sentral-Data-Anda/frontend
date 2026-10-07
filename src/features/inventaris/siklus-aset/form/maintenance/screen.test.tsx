import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

import { addDays, todayJakarta } from "@/lib/date";
import type { MenuAction } from "@/types/menu";

import {
  ASSET,
  MAINTENANCE,
} from "../../../../../../scripts/mock/inventaris-store";
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
  usePathname: () => `${CYCLE_LIST_PATH}/perawatan/baru`,
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

const { MaintenanceFormScreen } = await import("./screen");

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

const GENSET = "Genset Honda 5000 W";
const TODAY = todayJakarta();
const ALL: MenuAction[] = ["VIEW", "CREATE", "UPDATE", "DELETE"];

const onRender = (granted: MenuAction[], code?: string, barang = "") => {
  actions.current = granted;
  search.current = new URLSearchParams(barang ? { barang } : {});

  return renderWithClient(<MaintenanceFormScreen code={code} />);
};

const onPick = async (label: string, option: string) => {
  fireEvent.click(screen.getByLabelText(label));
  const item = await screen.findByRole("option", { name: option });
  fireEvent.pointerDown(item);
  fireEvent.click(item);
};

const onTypeDate = (label: string, iso: string) => {
  const input = screen.getByLabelText(label);
  fireEvent.change(input, {
    target: { value: iso.split("-").reverse().join("/") },
  });
  fireEvent.blur(input);
};

const onConfirmed = async (button: string) => {
  fireEvent.click(screen.getByRole("button", { name: button }));
  fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
};

describe("catat perawatan", () => {
  test("tanpa VIEW: keadaan tanpa akses, bukan pesan peran", () => {
    onRender([], "SKA-2026-0005");

    expect(
      screen.getByText("Anda tidak memiliki akses ke Siklus Aset"),
    ).toBeTruthy();
    expect(screen.queryByText(/Peran Anda/)).toBeNull();
    expect(calls).toEqual([]);
  });

  test("tanpa CREATE / UPDATE: tidak merender form", () => {
    onRender(["VIEW"]);
    expect(screen.getByText("Tidak bisa mencatat perawatan")).toBeTruthy();
    cleanup();

    onRender(["VIEW"], "SKA-2026-0001");
    expect(screen.getByText("Tidak bisa mengubah perawatan")).toBeTruthy();
  });

  test("Selesai memunculkan tanggal selesai yang wajib; simpan → tab perawatan + sorotan + invalidasi", async () => {
    const code = ASSET.find((row) => row.name === GENSET)?.code ?? "";
    const { client } = onRender(ALL, undefined, code);
    const invalidated: unknown[] = [];
    const original = client.invalidateQueries.bind(client);
    client.invalidateQueries = ((filters) => {
      invalidated.push(filters?.queryKey);
      return original(filters);
    }) as typeof client.invalidateQueries;

    await waitFor(() =>
      expect((screen.getByLabelText("Barang") as HTMLInputElement).value).toBe(
        GENSET,
      ),
    );
    expect(screen.queryByLabelText("Tanggal selesai")).toBeNull();

    await onPick("Status", "Selesai");
    onTypeDate("Tanggal rencana", TODAY);
    fireEvent.change(screen.getByLabelText("Keterangan"), {
      target: { value: "Ganti oli" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(
      await screen.findByText(
        "Tanggal selesai wajib diisi untuk perawatan selesai",
      ),
    ).toBeTruthy();

    onTypeDate("Tanggal selesai", TODAY);
    await onConfirmed("Simpan");

    await waitFor(() => expect(replaced).toHaveLength(1));
    expect(calls.find((call) => call.method === "POST")?.body).toEqual({
      assetId: assetIdOf(GENSET),
      status: "DONE",
      scheduledDate: TODAY,
      completedDate: TODAY,
      description: "Ganti oli",
    });
    expect(replaced[0]).toBe(CYCLE_LIST_PATH);
    expect(
      window.sessionStorage.getItem(`list-focus:${CYCLE_LIST_PATH}`),
    ).toMatch(/^SKA-/);
    expect(invalidated).toEqual(
      expect.arrayContaining([["asset-cycle"], ["asset"], ["ddl"]]),
    );
  });

  test("ubah: barang hanya dibaca, hapus lewat konfirmasi", async () => {
    const row = MAINTENANCE.find((item) => item.status === "SCHEDULED");

    onRender(ALL, row?.code);

    expect(
      await screen.findByText("Perawatan tidak bisa dipindah ke barang lain."),
    ).toBeTruthy();
    expect(screen.queryByRole("combobox", { name: "Barang" })).toBeNull();

    await onConfirmed("Hapus");

    await waitFor(() => expect(replaced).toHaveLength(1));
    expect(calls.some((call) => call.method === "DELETE")).toBe(true);
  });
});

describe("tanggal rencana boleh di masa depan", () => {
  test("Tanggal rencana di masa depan diterima", () => {
    onRender(["VIEW", "CREATE"]);

    onTypeDate("Tanggal rencana", addDays(todayJakarta(), 90));

    const box = screen.getByLabelText("Tanggal rencana");

    expect(
      screen.queryByText(/tidak boleh di masa depan/)?.textContent,
    ).toBeUndefined();
    expect(box.getAttribute("aria-invalid")).toBeNull();
  });
});
