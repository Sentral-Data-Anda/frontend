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

import type { MenuAction } from "@/types/menu";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/keuangan/persembahan/kolekte",
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

const { KolekteScreen } = await import("./kolekte-screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
});

const TYPES = [
  {
    id: 1,
    code: "TPS-0001",
    name: "Kolekte",
    hasPeriod: false,
    requiresJemaat: false,
    isActive: true,
  },
  {
    id: 2,
    code: "TPS-0002",
    name: "Perpuluhan",
    hasPeriod: false,
    requiresJemaat: true,
    isActive: true,
  },
  {
    id: 3,
    code: "TPS-0003",
    name: "Persembahan Bulanan",
    hasPeriod: true,
    requiresJemaat: true,
    isActive: true,
  },
];

const JEMAAT = [
  { id: 4, code: "JMT-0004", name: "Debora Manurung" },
  { id: 5, code: "JMT-0005", name: "Eleazar Panggabean" },
];

type Failure = {
  status: number;
  error: string;
  code?: string;
  issues?: { path: string; message: string }[];
};

const onMockApi = (failure?: Failure) => {
  const calls: { method: string; url: string; body?: unknown }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (method === "GET") {
      const rows = url.includes("/ddl/tipe-persembahan")
        ? TYPES
        : url.includes("/ddl/jemaat")
          ? JEMAAT
          : [];

      return rows.length > 0
        ? Response.json({
            status: 200,
            totalData: rows.length,
            totalPage: 1,
            data: rows,
          })
        : Response.json(
            { status: 404, error: "Tidak Ditemukan" },
            { status: 404 },
          );
    }

    calls.push({ method, url, body: JSON.parse(String(init?.body)) });

    if (failure) return Response.json(failure, { status: failure.status });

    return Response.json(
      {
        status: 201,
        message: "Berhasil Mencatat 2 Persembahan",
        data: [{ code: "PSB-2026-0041" }],
      },
      { status: 201 },
    );
  }) as typeof fetch;

  return calls;
};

const onRender = (granted: MenuAction[] = ["VIEW", "CREATE"]) => {
  actions.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <KolekteScreen />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

// Setiap baris punya popup sendiri dengan nama pilihan yang sama, jadi yang
// dipakai adalah popup yang baru dibuka: paling akhir di DOM.
const onPickType = async (index: number, label: string) => {
  fireEvent.click(await screen.findByLabelText(`Tipe baris ${index + 1}`));

  const options = await screen.findAllByRole("option", { name: label });
  const option = options[options.length - 1] as HTMLElement;

  // Base UI menetapkan pilihan pada pointerup, bukan pada click saja.
  fireEvent.pointerDown(option, { pointerType: "mouse", button: 0 });
  fireEvent.pointerUp(option, { pointerType: "mouse", button: 0 });
  fireEvent.click(option);
};

const amountAt = (index: number) =>
  screen.getByLabelText(`Nominal (Rp) baris ${index + 1}`) as HTMLInputElement;

const onFillRow = async (index: number, label: string, amount: string) => {
  await onPickType(index, label);
  fireEvent.change(amountAt(index), { target: { value: amount } });
};

const onSubmit = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Simpan kolekte" }));
  fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
};

describe("gerbang izin", () => {
  test("tanpa CREATE: form tidak dirender", () => {
    onRender(["VIEW"]);

    expect(screen.getByText("Tidak bisa mencatat kolekte")).toBeTruthy();
    expect(screen.queryByLabelText("Tanggal terima")).toBeNull();
  });
});

describe("baris mengikuti tipe", () => {
  test("tipe biasa: nama pemberi, tanpa Jemaat dan tanpa Periode", async () => {
    onMockApi();
    onRender();

    await onPickType(0, "Kolekte");

    expect(screen.getByLabelText("Nama pemberi baris 1")).toBeTruthy();
    expect(screen.queryByLabelText("Jemaat baris 1")).toBeNull();
    expect(screen.queryByLabelText("Periode baris 1")).toBeNull();
  });

  test("tipe wajib jemaat: Jemaat muncul, nama pemberi menghilang", async () => {
    onMockApi();
    onRender();

    await onPickType(0, "Perpuluhan");

    expect(screen.getByLabelText("Jemaat baris 1")).toBeTruthy();
    expect(screen.queryByLabelText("Nama pemberi baris 1")).toBeNull();
    expect(screen.queryByLabelText("Periode baris 1")).toBeNull();
  });

  test("tipe berperiode: Periode muncul di baris itu", async () => {
    onMockApi();
    onRender();

    await onPickType(0, "Persembahan Bulanan");

    expect(screen.getByLabelText("Jemaat baris 1")).toBeTruthy();
    expect(screen.getByLabelText("Periode baris 1")).toBeTruthy();
  });

  test("anonim tidak menagih nama pemberi", async () => {
    const calls = onMockApi();
    onRender();

    await onFillRow(0, "Kolekte", "50000");
    await onSubmit();

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0]?.body).toMatchObject({
      items: [{ typePersembahanId: 1, donorName: null, amount: 50000 }],
    });
  });
});

describe("batch", () => {
  test("satu simpan mengirim satu payload dengan items[]", async () => {
    const calls = onMockApi();
    onRender();

    await onFillRow(0, "Kolekte", "50000");
    fireEvent.click(screen.getByRole("button", { name: "Tambah baris" }));
    await onFillRow(1, "Kolekte", "75000");

    expect(screen.getByText("2 baris · Total Rp 125.000")).toBeTruthy();

    await onSubmit();

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0]?.url).toBe("/api/v1/persembahan/batch");
    expect(calls[0]?.method).toBe("POST");
    expect((calls[0]?.body as { items: unknown[] }).items).toHaveLength(2);
    await waitFor(() => expect(replaced).toEqual(["/keuangan/persembahan"]));
  });

  test("satu baris ditolak: galat di baris itu, seluruh isian tetap ada", async () => {
    onMockApi({
      status: 400,
      error: "Baris Ini Sama Dengan Baris 1",
      issues: [
        { path: "items.1.amount", message: "Baris Ini Sama Dengan Baris 1" },
      ],
    });
    onRender();

    await onFillRow(0, "Kolekte", "50000");
    fireEvent.click(screen.getByRole("button", { name: "Tambah baris" }));
    await onFillRow(1, "Kolekte", "50000");
    fireEvent.click(screen.getByRole("button", { name: "Tambah baris" }));
    await onFillRow(2, "Kolekte", "95000");

    await onSubmit();

    const message = await screen.findByText("Baris Ini Sama Dengan Baris 1");

    // Baris yang benar tidak dihapus: klerk memperbaiki satu baris lalu simpan lagi.
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(amountAt(0).value).toBe("50.000");
    expect(amountAt(1).value).toBe("50.000");
    expect(amountAt(2).value).toBe("95.000");
    expect(replaced).toEqual([]);

    expect(amountAt(1).getAttribute("id")).toBe("items.1.amount");
    expect(amountAt(1).getAttribute("aria-invalid")).toBe("true");
    expect(amountAt(1).getAttribute("aria-describedby")).toBe(message.id);
    expect(amountAt(0).getAttribute("aria-invalid")).toBeNull();
    expect(amountAt(2).getAttribute("aria-invalid")).toBeNull();
  });

  test("bulan tertutup: pesan server apa adanya plus tautan Periode Fiskal", async () => {
    onMockApi({
      status: 400,
      error: "Periode Fiskal Juli 2026 Sudah Ditutup",
      code: "PERIOD_CLOSED",
    });
    onRender();

    await onFillRow(0, "Kolekte", "50000");
    await onSubmit();

    expect(
      await screen.findByText("Periode Fiskal Juli 2026 Sudah Ditutup"),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Lihat periode fiskal" })
        .getAttribute("href"),
    ).toBe("/keuangan/periode-fiskal");
    expect(replaced).toEqual([]);
  });
});

describe("hitung fisik", () => {
  test("berbeda: memperingatkan tanpa memblokir, dan tidak ikut terkirim", async () => {
    const calls = onMockApi();
    onRender();

    await onFillRow(0, "Kolekte", "50000");
    fireEvent.change(screen.getByLabelText("Jumlah hasil hitung fisik (Rp)"), {
      target: { value: "60000" },
    });

    expect(
      screen.getByText(/Hitungan fisik berbeda Rp 10.000 dari total baris/),
    ).toBeTruthy();
    expect(
      (
        screen.getByRole("button", {
          name: "Simpan kolekte",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);

    await onSubmit();

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(Object.keys(calls[0]?.body as object)).not.toContain("countCheck");
  });

  test("sama dengan total baris: tanpa peringatan", async () => {
    onMockApi();
    onRender();

    await onFillRow(0, "Kolekte", "50000");
    fireEvent.change(screen.getByLabelText("Jumlah hasil hitung fisik (Rp)"), {
      target: { value: "50000" },
    });

    expect(screen.queryByText(/Hitungan fisik berbeda/)).toBeNull();
  });
});
