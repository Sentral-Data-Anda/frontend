import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: false,
    isCanCreate: false,
    isCanUpdate: false,
    isCanDelete: false,
  }),
}));

const { OfferingTypeListScreen } = await import("./screen");
const { OfferingTypeListItemRow } = await import("./list-item");

afterEach(cleanup);

const ROW = {
  id: 6,
  publicId: "tps-0006",
  code: "TPS-0006",
  name: "Persembahan Khusus",
  isActive: true,
  hasPeriod: false,
  requiresJemaat: false,
  accountId: null,
  account: null,
};

describe("gerbang VIEW daftar", () => {
  test("tanpa VIEW: keadaan tanpa akses, tanpa daftar dan tanpa permintaan", () => {
    const original = globalThis.fetch;
    let isFetched = false;
    globalThis.fetch = (() => {
      isFetched = true;
      return Promise.resolve(Response.json({}));
    }) as unknown as typeof fetch;

    render(<OfferingTypeListScreen />);

    expect(
      screen.getByText("Anda tidak memiliki akses ke Tipe Persembahan"),
    ).toBeTruthy();
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(isFetched).toBe(false);

    globalThis.fetch = original;
  });
});

describe("baris daftar", () => {
  test("tipe tanpa akun ditandai Belum ada akun", () => {
    render(
      <ul>
        <OfferingTypeListItemRow offeringType={ROW} />
      </ul>,
    );

    expect(screen.getByText("Belum ada akun")).toBeTruthy();
  });

  test("akun terpilih tampil kode dan nama, tanpa penanda", () => {
    render(
      <ul>
        <OfferingTypeListItemRow
          offeringType={{
            ...ROW,
            accountId: 16,
            account: {
              id: 16,
              code: "4-100",
              name: "Persembahan Kolekte",
              type: "INCOME",
              isActive: true,
            },
          }}
        />
      </ul>,
    );

    expect(screen.getByText("4-100 — Persembahan Kolekte")).toBeTruthy();
    expect(screen.queryByText("Belum ada akun")).toBeNull();
  });

  test("kedua flag menyala memunculkan dua badge", () => {
    render(
      <ul>
        <OfferingTypeListItemRow
          offeringType={{ ...ROW, hasPeriod: true, requiresJemaat: true }}
        />
      </ul>,
    );

    expect(screen.getByText("Periode")).toBeTruthy();
    expect(screen.getByText("Wajib jemaat")).toBeTruthy();
  });

  test("tipe nonaktif menampilkan statusnya, bukan flag", () => {
    render(
      <ul>
        <OfferingTypeListItemRow
          offeringType={{
            ...ROW,
            isActive: false,
            hasPeriod: true,
            requiresJemaat: true,
          }}
        />
      </ul>,
    );

    expect(screen.getByText("Nonaktif")).toBeTruthy();
    expect(screen.queryByText("Periode")).toBeNull();
  });
});
