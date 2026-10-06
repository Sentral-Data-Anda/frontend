import { Toast } from "@base-ui/react/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import type { MenuAction } from "@/types/menu";

import { PENETAPAN_LIST_PATH } from "../model";
import type { KomponenPayrollOption, PenetapanKomponen } from "../types";

const actions: { current: MenuAction[] } = { current: [] };

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/sdm/komponen-payroll/karyawan/baru",
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

const { PenetapanFormScreen } = await import("./penetapan-screen");

const originalFetch = globalThis.fetch;

const COMPONENTS: KomponenPayrollOption[] = [
  {
    id: 1,
    code: "KPY-0001",
    name: "Tunjangan Transport",
    type: "EARNING",
    calculationType: "FIXED",
    defaultValue: "350000.00",
  },
  {
    id: 2,
    code: "KPY-0002",
    name: "Tunjangan Jabatan",
    type: "EARNING",
    calculationType: "FIXED",
    defaultValue: null,
  },
];

const DETAIL: PenetapanKomponen = {
  publicId: "kkp-1",
  karyawanId: 1,
  payrollComponentId: 2,
  value: "750000.00",
  effectiveFrom: "2026-01-01T00:00:00.000Z",
  effectiveTo: null,
  karyawan: { publicId: "kry-1", code: "KRY-0001", name: "Ani Wijaya" },
  payrollComponent: {
    publicId: "kpy-2",
    code: "KPY-0002",
    name: "Tunjangan Jabatan",
    type: "EARNING",
  },
};

const onMockApi = () => {
  globalThis.fetch = ((input: string | URL) => {
    const href = String(input);

    if (href.includes("/ddl/komponen-payroll")) {
      return Promise.resolve(
        Response.json({ status: 200, message: "ok", data: COMPONENTS }),
      );
    }

    if (href.includes("/ddl/karyawan")) {
      return Promise.resolve(
        Response.json({
          status: 200,
          message: "ok",
          data: [{ id: 1, code: "KRY-0001", name: "Ani Wijaya" }],
        }),
      );
    }

    return Promise.resolve(
      Response.json({ status: 200, message: "ok", data: DETAIL }),
    );
  }) as unknown as typeof fetch;
};

const onRender = (granted: MenuAction[], publicId?: string) => {
  actions.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <PenetapanFormScreen publicId={publicId} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
});

describe("gerbang izin form penetapan", () => {
  test("tanpa CREATE: rute /baru tidak merender form", () => {
    onRender(["VIEW"]);

    expect(screen.getByText("Tidak bisa menambah penetapan")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Kembali ke Penetapan" })
        .getAttribute("href"),
    ).toBe(PENETAPAN_LIST_PATH);
    expect(screen.queryByLabelText("Berlaku dari")).toBeNull();
  });

  test("tanpa UPDATE: rute /ubah tidak merender form dan tidak memuat detail", () => {
    let isFetched = false;
    globalThis.fetch = (() => {
      isFetched = true;
      return Promise.resolve(Response.json({}));
    }) as unknown as typeof fetch;

    onRender(["VIEW", "CREATE"], "kkp-1");

    expect(screen.getByText("Tidak bisa mengubah penetapan")).toBeTruthy();
    expect(isFetched).toBe(false);
  });

  test("Hapus hanya dengan DELETE", async () => {
    onMockApi();
    onRender(["VIEW", "UPDATE"], "kkp-1");

    await waitFor(() =>
      expect(
        (screen.getByLabelText("Karyawan") as HTMLInputElement).readOnly,
      ).toBe(true),
    );
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();

    cleanup();
    onRender(["VIEW", "UPDATE", "DELETE"], "kkp-1");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Hapus" })).toBeTruthy(),
    );
  });
});

describe("penanda data gaji", () => {
  test("menetap di form penetapan", () => {
    onMockApi();
    onRender(["VIEW", "CREATE"]);

    expect(screen.getByText("Data gaji")).toBeTruthy();
  });
});

describe("pasangan karyawan dan komponen tidak bisa dipindahkan", () => {
  test("pada ubah keduanya read-only, bukan pilihan", async () => {
    onMockApi();
    onRender(["VIEW", "UPDATE"], "kkp-1");

    await waitFor(() =>
      expect(
        (screen.getByLabelText("Karyawan") as HTMLInputElement).readOnly,
      ).toBe(true),
    );

    const karyawan = screen.getByLabelText("Karyawan") as HTMLInputElement;
    const component = screen.getByLabelText("Komponen") as HTMLInputElement;

    expect(karyawan.value).toBe("Ani Wijaya");
    expect(component.readOnly).toBe(true);
    expect(component.value).toBe("Tunjangan Jabatan");
    expect(
      screen.getByText(
        "Karyawan dan komponen tidak bisa dipindahkan. Hapus penetapan ini lalu buat yang baru.",
      ),
    ).toBeTruthy();
  });

  test("komponen tanpa default: pilihan Pakai default komponen dimatikan", async () => {
    onMockApi();
    onRender(["VIEW", "UPDATE"], "kkp-1");

    await waitFor(() =>
      expect(
        screen.getByText(
          "Komponen ini tidak punya nilai default, jadi nilainya wajib diisi.",
        ),
      ).toBeTruthy(),
    );

    const choice = screen.getByLabelText(
      "Pakai default komponen",
    ) as HTMLInputElement;

    expect(choice.disabled).toBe(true);
    expect(screen.getByLabelText("Nilai (Rp)")).toBeTruthy();
  });
});
