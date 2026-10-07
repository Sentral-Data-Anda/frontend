import { Toast } from "@base-ui/react/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import { addDays, toInputText, todayJakarta } from "@/lib/date";
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

// Pemilih be-sada menyaring `isActive` saja, jadi baris PPH21 memang bisa
// sampai ke sini. Layar yang menolaknya adalah penjaga keduanya.
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
  {
    id: 4,
    code: "KPY-0004",
    name: "Iuran BPJS",
    type: "DEDUCTION",
    calculationType: "PERCENTAGE",
    defaultValue: "1.00",
  },
  {
    id: 6,
    code: "PPH21",
    name: "PPh21",
    type: "DEDUCTION",
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
    calculationType: "FIXED",
    defaultValue: null,
    isActive: true,
  },
};

// Nilai null di atas komponen yang punya default: bentuk yang harus benar-benar
// terkirim sebagai null, bukan dihilangkan dari badan permintaan.
const WITH_DEFAULT: PenetapanKomponen = {
  ...DETAIL,
  value: null,
  payrollComponentId: 1,
  payrollComponent: {
    publicId: "kpy-1",
    code: "KPY-0001",
    name: "Tunjangan Transport",
    type: "EARNING",
    calculationType: "FIXED",
    defaultValue: "350000.00",
    isActive: true,
  },
};

// Komponen yang sudah dimatikan hilang dari pemilih, jadi form ubahnya hanya
// punya relasi penetapan untuk bercabang.
const RETIRED: PenetapanKomponen = {
  ...DETAIL,
  publicId: "kkp-9",
  payrollComponentId: 4,
  value: "2.00",
  payrollComponent: {
    publicId: "kpy-4",
    code: "KPY-0004",
    name: "Iuran BPJS",
    type: "DEDUCTION",
    calculationType: "PERCENTAGE",
    defaultValue: "1.00",
    isActive: false,
  },
};

const sent: { method: string; body: unknown }[] = [];

const onMockApi = (detail: PenetapanKomponen = DETAIL) => {
  globalThis.fetch = ((input: string | URL, init?: RequestInit) => {
    const href = String(input);
    const method = init?.method ?? "GET";

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

    if (method !== "GET") {
      sent.push({
        method,
        body: JSON.parse(String(init?.body ?? "{}")) as unknown,
      });
    }

    return Promise.resolve(
      Response.json({ status: 200, message: "ok", data: detail }),
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
  sent.length = 0;
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

describe("payload penetapan, dari layar", () => {
  test("tanggal YYYY-MM-DD dan nilai null benar-benar terkirim", async () => {
    onMockApi(WITH_DEFAULT);
    onRender(["VIEW", "UPDATE"], "kkp-1");

    await waitFor(() =>
      expect(
        (screen.getByLabelText("Karyawan") as HTMLInputElement).readOnly,
      ).toBe(true),
    );

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(sent.length).toBe(1));
    expect(sent[0].method).toBe("PUT");
    expect(sent[0].body).toMatchObject({
      karyawanId: 1,
      payrollComponentId: 1,
      value: null,
      effectiveFrom: "2026-01-01",
      effectiveTo: null,
    });
    expect(Object.prototype.hasOwnProperty.call(sent[0].body, "value")).toBe(
      true,
    );
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

  test("komponen nonaktif: cabangnya datang dari relasi, bukan dari pemilih", async () => {
    onMockApi(RETIRED);
    onRender(["VIEW", "UPDATE"], "kkp-9");

    // Label, batas digit, dan penjaga persen semuanya bergantung pada
    // `calculationType`, yang pemilih aktif-saja tidak punya untuk baris ini.
    await waitFor(() =>
      expect(screen.getByLabelText("Persentase (%)")).toBeTruthy(),
    );
    expect(screen.queryByLabelText("Nilai (Rp)")).toBeNull();
    expect(
      screen.getByText(
        "Komponen ini sudah nonaktif, jadi penetapan ini tidak dibayarkan pada penggajian berikutnya.",
      ),
    ).toBeTruthy();
  });

  test("persentase di atas 100 ditolak di layar, bukan ditemukan server", async () => {
    onMockApi(RETIRED);
    onRender(["VIEW", "UPDATE"], "kkp-9");

    const value = await waitFor(() => screen.getByLabelText("Persentase (%)"));

    fireEvent.change(value, { target: { value: "999" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(
      await screen.findByText("Persentase tidak boleh lebih dari 100"),
    ).toBeTruthy();
    expect(sent.length).toBe(0);
  });
});

describe("masa berlaku penetapan boleh di masa depan", () => {
  test.each([
    ["Berlaku dari", "effectiveFrom"],
    ["Berlaku sampai (opsional)", "effectiveTo"],
  ])("%s di masa depan diterima dan terkirim", async (label, key) => {
    onMockApi(WITH_DEFAULT);
    onRender(["VIEW", "UPDATE"], "kkp-1");

    await waitFor(() =>
      expect(
        (screen.getByLabelText("Karyawan") as HTMLInputElement).readOnly,
      ).toBe(true),
    );

    const future = addDays(todayJakarta(), 90);
    const box = screen.getByLabelText(label) as HTMLInputElement;

    fireEvent.change(box, { target: { value: toInputText(future) } });
    fireEvent.blur(box);

    expect(
      screen.queryByText(/tidak boleh di masa depan/)?.textContent,
    ).toBeUndefined();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(sent.length).toBe(1));
    expect((sent[0].body as Record<string, unknown>)[key]).toBe(future);
  });
});
