import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

import { todayJakarta } from "@/lib/date";
import type { MenuAction } from "@/types/menu";

import {
  DISPOSAL,
  submitDisposal,
} from "../../../../../../scripts/mock/inventaris-store";
import {
  assetIdOf,
  onStubCycleFetch,
  renderWithClient,
  restoreCycleStore,
  type Call,
} from "../../fixtures";
import { CYCLE_LIST_PATH } from "../../model";

const actions: {
  current: MenuAction[];
  approval: MenuAction[];
} = { current: [], approval: [] };
const calls: Call[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => undefined }),
  usePathname: () => `${CYCLE_LIST_PATH}/pelepasan/x`,
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: (slug: string) => {
    const granted =
      slug === "APPROVAL_REQUEST" ? actions.approval : actions.current;

    return {
      isCanView: granted.includes("VIEW"),
      isCanCreate: granted.includes("CREATE"),
      isCanUpdate: granted.includes("UPDATE"),
      isCanDelete: granted.includes("DELETE"),
    };
  },
}));

const { DisposalDetailScreen } = await import("./screen");

let onRestoreFetch: () => void;

beforeEach(() => {
  onRestoreFetch = onStubCycleFetch(calls);
});

afterEach(() => {
  cleanup();
  onRestoreFetch();
  restoreCycleStore();
  calls.length = 0;
});

const codeOf = (status: string) =>
  DISPOSAL.find((row) => row.status === status)?.code ?? "";

const onRender = (
  code: string,
  granted: MenuAction[],
  approval: MenuAction[] = [],
) => {
  actions.current = granted;
  actions.approval = approval;

  return renderWithClient(<DisposalDetailScreen code={code} />);
};

const otherPending = () => {
  const row = submitDisposal({
    assetId: assetIdOf("Genset Honda 5000 W"),
    method: "LOST",
    disposalDate: todayJakarta(),
    reason: "Hilang",
    proceeds: 0,
  });
  row.submittedBy = 12;

  return row.code;
};

const ownPending = () =>
  submitDisposal({
    assetId: assetIdOf("Kamera Canon EOS M50"),
    method: "SCRAPPED",
    disposalDate: todayJakarta(),
    reason: "Rusak",
    proceeds: 0,
  }).code;

describe("halaman pelepasan", () => {
  test.each([
    ["APPROVED", "Barang sudah dilepas."],
    [
      "REJECTED",
      "Barang tetap aktif; alasan penolakan ada di permintaan persetujuan.",
    ],
  ])("%s: status tanpa aksi Tarik", async (status, note) => {
    onRender(codeOf(status), ["VIEW", "DELETE"]);

    expect(await screen.findByText(note)).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Tarik pengajuan" }),
    ).toBeNull();
  });

  test("Menunggu tanpa DELETE: tanpa Tarik; tautan persetujuan hanya dengan VIEW-nya", async () => {
    onRender(otherPending(), ["VIEW"]);

    expect(await screen.findByText("Barang belum dilepas.")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Tarik pengajuan" }),
    ).toBeNull();
    expect(screen.queryByRole("link", { name: /^PST-/ })).toBeNull();
    cleanup();

    onRender(otherPending(), ["VIEW"], ["VIEW"]);
    const link = await screen.findByRole("link", {
      name: /^PST-.* · Menunggu$/,
    });
    expect(link.getAttribute("href")).toMatch(
      /^\/approval\/approval-request\/0b5e7a00-/,
    );
  });

  test("tarik pengajuan orang lain → 403 tampil apa adanya", async () => {
    onRender(otherPending(), ["VIEW", "DELETE"]);

    fireEvent.click(
      await screen.findByRole("button", { name: "Tarik pengajuan" }),
    );
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    expect(
      await screen.findByText(
        "Hanya Pengaju Yang Dapat Menarik Permintaan Ini",
      ),
    ).toBeTruthy();
  });

  test("tarik pengajuan sendiri → Ditarik, dibaca ulang", async () => {
    onRender(ownPending(), ["VIEW", "DELETE"]);

    fireEvent.click(
      await screen.findByRole("button", { name: "Tarik pengajuan" }),
    );
    expect(
      screen.getByText(
        "Apakah Anda ingin menarik pengajuan pelepasan ini? Barang kembali aktif.",
      ),
    ).toBeTruthy();
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    expect(
      await screen.findByText("Pengajuan ditarik; barang aktif lagi."),
    ).toBeTruthy();
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Tarik pengajuan" }),
      ).toBeNull(),
    );
    expect(
      calls.some(
        (call) => call.method === "PUT" && call.path.endsWith("/tarik"),
      ),
    ).toBe(true);
  });

  test("kode tidak ada → tidak ditemukan", async () => {
    onRender("SKA-1999-0001", ["VIEW"]);

    expect(
      await screen.findByText("Data pelepasan tidak ditemukan"),
    ).toBeTruthy();
  });
});
