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

import type { BudgetSetting, CeilingUsage } from "@/types/anggaran";
import type { MenuAction } from "@/types/menu";

import type { BudgetAllocationDetail } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/anggaran/pagu-anggaran/baru",
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

const { AllocationFormScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
});

const YEAR = 2026;

const budgetYear = (year: number) => ({
  year,
  startMonth: 7,
  from: `${year}-07-01`,
  to: `${year + 1}-06-30`,
  label: `${year}/${year + 1} label server`,
});

const SETTING: BudgetSetting = {
  startMonth: 7,
  budgetYear: budgetYear(YEAR),
  budgetYears: [budgetYear(YEAR - 1), budgetYear(YEAR), budgetYear(YEAR + 1)],
};

const usage: CeilingUsage = {
  year: YEAR,
  ceiling: "45000000",
  committed: "12000000",
  remaining: "33000000",
  isWithinCeiling: true,
  disbursed: "9000000",
  reported: "4500000",
  untagged: "0",
};

const ALLOCATION: BudgetAllocationDetail = {
  publicId: "pga-1",
  bapelId: 2,
  year: YEAR,
  budgetYear: budgetYear(YEAR),
  amount: "45000000",
  bapel: { publicId: "bpl-2", code: "BPL-2", name: "Komisi Pemuda" },
  usage,
};

type Call = { url: string; method: string; body?: unknown };

const DDL_BAPEL = [
  { id: 2, code: "BPL-2", name: "Komisi Pemuda", isActive: true },
  { id: 3, code: "BPL-3", name: "Komisi Wanita", isActive: true },
];

const onMockApi = (routes: Record<string, () => Response> = {}) => {
  const calls: Call[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    calls.push({
      url,
      method,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });

    const route = routes[`${method} ${url.split("?")[0]}`];
    if (route) return route();

    if (url.startsWith("/api/v1/setelan-anggaran")) {
      return Response.json({ status: 200, message: "ok", data: SETTING });
    }

    if (url.startsWith("/api/v1/ddl/bapel")) {
      return Response.json({ status: 200, message: "ok", data: DDL_BAPEL });
    }

    if (url.startsWith("/api/v1/pagu-anggaran/pga-1")) {
      return Response.json({ status: 200, message: "ok", data: ALLOCATION });
    }

    return Response.json({ status: 200, message: "ok", data: [] });
  }) as typeof fetch;

  return calls;
};

const onRender = (
  granted: MenuAction[],
  routes: Record<string, () => Response> = {},
  publicId?: string,
) => {
  actions.current = granted;
  const calls = onMockApi(routes);

  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <AllocationFormScreen publicId={publicId} />
      </Toast.Provider>
    </QueryClientProvider>,
  );

  return calls;
};

const onConfirm = async (name = "Simpan") => {
  fireEvent.click(screen.getByRole("button", { name }));
  fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
};

const onFillAmount = (value: string) => {
  fireEvent.change(screen.getByLabelText("Pagu (Rp)"), {
    target: { value },
  });
};

describe("form pagu anggaran", () => {
  test("tanpa CREATE tidak merender form", () => {
    onRender(["VIEW"]);

    expect(screen.getByText("Tidak bisa menambah pagu anggaran")).toBeTruthy();
    expect(screen.queryByLabelText("Pagu (Rp)")).toBeNull();
  });

  test("teks bantuan menyebut sumber dana apa pun dan kepemilikan Majelis", async () => {
    onRender(["VIEW", "CREATE"]);

    const note = await screen.findByText(/^Pagu membatasi seluruh belanja/);

    expect(note.textContent).toContain("dana khusus");
    expect(note.textContent).toContain("Angka ini milik Majelis Jemaat");
    expect(
      screen.getByText(/Usulan yang jatuh tepat di batas tetap diterima/),
    ).toBeTruthy();
  });

  test("tahun bawaan dan labelnya datang dari server", async () => {
    onRender(["VIEW", "CREATE"]);

    await waitFor(() =>
      expect(
        screen.getByRole("combobox", { name: "Tahun pelayanan" }).textContent,
      ).toBe(`${YEAR}/${YEAR + 1} label server`),
    );
  });

  test("nominal nol ditolak klien tanpa memanggil server", async () => {
    const calls = onRender(["VIEW", "CREATE"]);
    await screen.findByLabelText("Pagu (Rp)");

    onFillAmount("0");
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(
      await screen.findByText("Pagu anggaran harus lebih dari 0"),
    ).toBeTruthy();
    expect(calls.some((call) => call.method === "POST")).toBe(false);
  });

  test("409 duplikat jatuh ke field tahun", async () => {
    onRender(["VIEW", "CREATE"], {
      "POST /api/v1/pagu-anggaran": () =>
        Response.json(
          {
            status: 409,
            error: "Pagu Anggaran Komisi Ini Untuk Tahun 2026 Sudah Ada",
            issues: [
              {
                path: "year",
                message:
                  "Pagu Anggaran Komisi Ini Untuk Tahun 2026 Sudah Ada. Ubah Yang Lama",
              },
            ],
          },
          { status: 409 },
        ),
    });

    await screen.findByLabelText("Pagu (Rp)");
    fireEvent.click(screen.getByRole("combobox", { name: "Badan pelayanan" }));
    fireEvent.click(
      await screen.findByRole("option", { name: /Komisi Pemuda/ }),
    );
    onFillAmount("45000000");
    await onConfirm();

    expect(
      await screen.findByText(
        "Pagu Anggaran Komisi Ini Untuk Tahun 2026 Sudah Ada. Ubah Yang Lama",
      ),
    ).toBeTruthy();
  });

  test("simpan mengirim tiga field dan menuju halaman pagunya", async () => {
    const calls = onRender(["VIEW", "CREATE"], {
      "POST /api/v1/pagu-anggaran": () =>
        Response.json({
          status: 201,
          message: "Berhasil Menambahkan Pagu Anggaran",
          data: ALLOCATION,
        }),
    });

    await screen.findByLabelText("Pagu (Rp)");
    fireEvent.click(screen.getByRole("combobox", { name: "Badan pelayanan" }));
    fireEvent.click(
      await screen.findByRole("option", { name: /Komisi Pemuda/ }),
    );
    onFillAmount("45000000");
    await onConfirm();

    await waitFor(() =>
      expect(replaced).toEqual(["/anggaran/pagu-anggaran/pga-1"]),
    );
    expect(calls.find((call) => call.method === "POST")?.body).toEqual({
      bapelId: 2,
      year: YEAR,
      amount: "45000000",
    });
    expect(
      window.sessionStorage.getItem("list-focus:/anggaran/pagu-anggaran"),
    ).toBe("pga-1");
  });

  test("ubah: konfirmasi hapus berbunyi dihapus permanen", async () => {
    onRender(["VIEW", "UPDATE", "DELETE"], {}, "pga-1");

    await waitFor(() =>
      expect(
        (screen.getByLabelText("Pagu (Rp)") as HTMLInputElement).value,
      ).toBe("45.000.000"),
    );

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));

    expect(
      await screen.findByText(
        `Apakah Anda ingin menghapus pagu anggaran Komisi Pemuda tahun ${YEAR}/${YEAR + 1} label server? Baris ini dihapus permanen.`,
      ),
    ).toBeTruthy();
  });

  test("hapus ditolak CEILING_IN_USE: spanduk menawarkan ubah nominal", async () => {
    onRender(
      ["VIEW", "UPDATE", "DELETE"],
      {
        "DELETE /api/v1/pagu-anggaran/pga-1": () =>
          Response.json(
            {
              status: 400,
              code: "CEILING_IN_USE",
              error:
                "Pagu Anggaran Ini Sudah Dipakai Oleh Program. Ubah Nominalnya, Jangan Dihapus",
            },
            { status: 400 },
          ),
      },
      "pga-1",
    );

    await screen.findByLabelText("Pagu (Rp)");
    await onConfirm("Hapus");

    expect(await screen.findByText(/Sudah Dipakai Oleh Program/)).toBeTruthy();
    expect(screen.getByText(/Ubah nominalnya di form ini/)).toBeTruthy();
    expect(replaced).toEqual([]);
  });

  test("pesan yang memuat kata program tanpa code: spanduk tanpa tawaran", async () => {
    onRender(
      ["VIEW", "UPDATE", "DELETE"],
      {
        "DELETE /api/v1/pagu-anggaran/pga-1": () =>
          Response.json(
            {
              status: 400,
              error: "Pagu Anggaran Ini Sudah Dipakai Oleh Program",
            },
            { status: 400 },
          ),
      },
      "pga-1",
    );

    await screen.findByLabelText("Pagu (Rp)");
    await onConfirm("Hapus");

    expect(
      await screen.findByText("Pagu Anggaran Ini Sudah Dipakai Oleh Program"),
    ).toBeTruthy();
    expect(screen.queryByText(/Ubah nominalnya di form ini/)).toBeNull();
  });

  test("code tak dikenal dirender apa adanya", async () => {
    onRender(
      ["VIEW", "UPDATE", "DELETE"],
      {
        "DELETE /api/v1/pagu-anggaran/pga-1": () =>
          Response.json(
            { status: 400, code: "SOMETHING_ELSE", error: "Galat lain" },
            { status: 400 },
          ),
      },
      "pga-1",
    );

    await screen.findByLabelText("Pagu (Rp)");
    await onConfirm("Hapus");

    expect(await screen.findByText("Galat lain")).toBeTruthy();
    expect(screen.queryByText(/Ubah nominalnya di form ini/)).toBeNull();
  });

  test("ubah tidak menawarkan mode batch", async () => {
    onRender(["VIEW", "UPDATE"], {}, "pga-1");
    await screen.findByLabelText("Pagu (Rp)");

    expect(
      screen.queryByRole("button", { name: "Beberapa badan pelayanan" }),
    ).toBeNull();
  });
});

describe("mode batch", () => {
  const onOpenBatch = async () => {
    fireEvent.click(
      await screen.findByRole("button", { name: "Beberapa badan pelayanan" }),
    );
  };

  test("sakelar mengubah form menjadi satu tahun dan daftar baris", async () => {
    onRender(["VIEW", "CREATE"]);
    await onOpenBatch();

    expect(
      screen.getByRole("list", { name: "Baris pagu anggaran" }),
    ).toBeTruthy();
    expect(screen.getAllByLabelText(/^Badan pelayanan baris/)).toHaveLength(2);
    expect(screen.queryByLabelText("Pagu (Rp)")).toBeNull();
  });

  test("satu baris cacat: galat ke barisnya, nol panggilan server", async () => {
    const calls = onRender(["VIEW", "CREATE"]);
    await onOpenBatch();

    fireEvent.click(
      screen.getByRole("combobox", { name: /^Badan pelayanan baris 1/ }),
    );
    fireEvent.click(
      await screen.findByRole("option", { name: /Komisi Pemuda/ }),
    );
    fireEvent.change(screen.getAllByLabelText(/^Pagu \(Rp\) baris/)[0]!, {
      target: { value: "1000000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Pilih badan pelayanan")).toBeTruthy();
    expect(screen.getByText("Isi pagu anggaran")).toBeTruthy();
    expect(calls.some((call) => call.method === "POST")).toBe(false);
  });

  test("batch terkirim sebagai satu transaksi lalu kembali ke daftar", async () => {
    const calls = onRender(["VIEW", "CREATE"], {
      "POST /api/v1/pagu-anggaran/batch": () =>
        Response.json({
          status: 201,
          message: "Berhasil Menambahkan 2 Pagu Anggaran",
          data: [ALLOCATION],
        }),
    });
    await onOpenBatch();

    fireEvent.click(screen.getByRole("button", { name: "Hapus baris 2" }));
    fireEvent.click(
      screen.getByRole("combobox", { name: /^Badan pelayanan baris 1/ }),
    );
    fireEvent.click(
      await screen.findByRole("option", { name: /Komisi Pemuda/ }),
    );
    fireEvent.change(screen.getByLabelText(/^Pagu \(Rp\) baris 1/), {
      target: { value: "1000000" },
    });

    await onConfirm();

    await waitFor(() => expect(replaced).toEqual(["/anggaran/pagu-anggaran"]));
    expect(calls.find((call) => call.method === "POST")?.body).toEqual({
      year: YEAR,
      items: [{ bapelId: 2, amount: "1000000" }],
    });
  });
});
