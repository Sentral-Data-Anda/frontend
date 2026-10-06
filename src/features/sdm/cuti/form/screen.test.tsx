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

import { MENU } from "@/config/menu";
import type { MenuAction } from "@/types/menu";

import { CUTI_LIST_PATH } from "../model";
import type { Cuti, HolidayDay } from "../types";

const grants: { current: Partial<Record<string, MenuAction[]>> } = {
  current: {},
};
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/sdm/cuti/CTI-0006/ubah",
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: (slug: string) => ({
    isCanView: Boolean(grants.current[slug]?.includes("VIEW")),
    isCanCreate: Boolean(grants.current[slug]?.includes("CREATE")),
    isCanUpdate: Boolean(grants.current[slug]?.includes("UPDATE")),
    isCanDelete: Boolean(grants.current[slug]?.includes("DELETE")),
  }),
}));

const { CutiFormScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

const DETAIL: Cuti = {
  id: 6,
  publicId: "cti-6",
  code: "CTI-0006",
  karyawanId: 2,
  leaveTypeId: 1,
  startDate: "2026-05-12T00:00:00.000Z",
  endDate: "2026-05-16T00:00:00.000Z",
  totalDays: "5",
  reason: "Menengok orang tua",
  status: "PENDING",
  rejectedReason: null,
  approvedAt: null,
  karyawan: {
    publicId: "kry-2",
    code: "KRY-0002",
    name: "Budi Santoso",
    position: "Koster",
  },
  leaveType: {
    publicId: "tct-1",
    code: "TCT-0001",
    name: "Cuti Tahunan",
    isPaid: true,
    maxDaysPerYear: 12,
  },
  approval: null,
};

type Failure = { status: number; error: string };

type Options = {
  detail?: Cuti;
  holidays?: HolidayDay[];
  quota?: Record<string, unknown>;
  save?: Failure;
};

const QUOTA_SPENT = {
  karyawan: { name: "Budi Santoso" },
  leaveType: { name: "Cuti Tahunan" },
  year: 2026,
  maxDaysPerYear: 12,
  taken: "14",
  remaining: "0",
};

const onMockApi = (options: Options = {}) => {
  const calls: { method: string; url: string; body?: unknown }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url.includes("/ddl/")) {
      return Response.json({
        status: 200,
        message: "ok",
        data: [
          { id: 1, code: "TCT-0001", name: "Cuti Tahunan" },
          { id: 2, code: "KRY-0002", name: "Budi Santoso" },
        ],
      });
    }

    if (url.includes("/hari-libur/kalender")) {
      return Response.json({
        status: 200,
        message: "ok",
        data: options.holidays ?? [],
      });
    }

    if (url.includes("/cuti/sisa-jatah")) {
      return Response.json({
        status: 200,
        message: "ok",
        data: options.quota ?? QUOTA_SPENT,
      });
    }

    if (url === "/api/v1/cuti/CTI-0006" && method === "PUT") {
      calls.push({ method, url, body: JSON.parse(String(init?.body)) });

      if (options.save) {
        return Response.json(options.save, { status: options.save.status });
      }

      return Response.json({
        status: 200,
        message: "Berhasil Mengubah Pengajuan Cuti",
        data: options.detail ?? DETAIL,
      });
    }

    if (url === "/api/v1/cuti/CTI-0006") {
      return Response.json({
        status: 200,
        message: "ok",
        data: options.detail ?? DETAIL,
      });
    }

    return Response.json(
      { status: 404, error: "Pengajuan Cuti Tidak Ditemukan" },
      { status: 404 },
    );
  }) as typeof fetch;

  return calls;
};

const onRenderForm = (
  granted: Partial<Record<string, MenuAction[]>>,
  code?: string,
) => {
  grants.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <CutiFormScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const onRenderLoadedEdit = async (
  granted: Partial<Record<string, MenuAction[]>> = {
    [MENU.CUTI]: ["VIEW", "UPDATE"],
  },
) => {
  onRenderForm(granted, "CTI-0006");

  await waitFor(() =>
    expect(
      (screen.getByLabelText("Tanggal mulai") as HTMLInputElement).value,
    ).toBe("12/05/2026"),
  );
};

const onType = (label: string, text: string) => {
  const box = screen.getByLabelText(label);
  fireEvent.change(box, { target: { value: text } });
  fireEvent.blur(box);
};

const onSaveConfirmed = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
  fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
};

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
});

describe("gerbang izin rute form", () => {
  test("tanpa CREATE: rute /baru tidak merender form", () => {
    onRenderForm({ [MENU.CUTI]: ["VIEW"] });

    expect(screen.getByText("Tidak bisa mengajukan cuti")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Kembali ke Cuti" })
        .getAttribute("href"),
    ).toBe(CUTI_LIST_PATH);
  });

  test("tanpa UPDATE: rute /ubah tidak merender form dan tidak memuat detail", () => {
    let isFetched = false;
    globalThis.fetch = (() => {
      isFetched = true;
      return Promise.resolve(Response.json({}));
    }) as unknown as typeof fetch;

    onRenderForm({ [MENU.CUTI]: ["VIEW", "CREATE"] }, "CTI-0006");

    expect(screen.getByText("Tidak bisa mengubah cuti")).toBeTruthy();
    expect(isFetched).toBe(false);
  });

  test("UPDATE atas menu LAIN tidak membuka form cuti", () => {
    onRenderForm({ [MENU.TIPE_CUTI]: ["VIEW", "CREATE", "UPDATE"] });

    expect(screen.getByText("Tidak bisa mengajukan cuti")).toBeTruthy();
  });

  test("tanpa prompt password: Cuti nol angka gaji (§0.3 no. 2)", () => {
    onMockApi();
    onRenderForm({ [MENU.CUTI]: ["VIEW", "CREATE"] });

    expect(screen.queryByLabelText(/password/i)).toBeNull();
    expect(screen.queryByText(/Data gaji/)).toBeNull();
  });
});

describe("baris yang tidak lagi bisa diubah", () => {
  test("baris yang sudah diproses merender keadaan terkunci, bukan form", async () => {
    onMockApi({ detail: { ...DETAIL, status: "APPROVED" } });
    onRenderForm({ [MENU.CUTI]: ["VIEW", "UPDATE"] }, "CTI-0006");

    await waitFor(() =>
      expect(
        screen.getByText("Pengajuan ini tidak bisa diubah lagi"),
      ).toBeTruthy(),
    );
    expect(screen.queryByLabelText("Tanggal mulai")).toBeNull();
  });

  test("baris yang sedang ditandatangani juga terkunci", async () => {
    onMockApi({
      detail: {
        ...DETAIL,
        approval: {
          publicId: "apr-1",
          code: "APR-0001",
          status: "PENDING",
          currentOrder: 1,
          steps: [],
        },
      },
    });
    onRenderForm({ [MENU.CUTI]: ["VIEW", "UPDATE"] }, "CTI-0006");

    await waitFor(() =>
      expect(
        screen.getByText("Pengajuan ini tidak bisa diubah lagi"),
      ).toBeTruthy(),
    );
  });
});

describe("ringkasan: hitungan hari dan sisa jatah", () => {
  test("hari libur dalam rentang dinamai dan dikurangi dari batas atas", async () => {
    onMockApi({
      holidays: [
        { date: "2026-05-14", name: "Kenaikan Isa Almasih", type: "NASIONAL" },
        { date: "2026-05-15", name: "Cuti Bersama", type: "CUTI_BERSAMA" },
      ],
    });
    await onRenderLoadedEdit();

    await waitFor(() =>
      expect(screen.getByText(/Kenaikan Isa Almasih/)).toBeTruthy(),
    );
    expect(screen.getByText("5 hari")).toBeTruthy();
    expect(screen.getByText("3 hari")).toBeTruthy();
  });

  test("layar tidak menjanjikan total yang tidak bisa diketahuinya", async () => {
    onMockApi();
    await onRenderLoadedEdit();

    const note = screen.getByText(/Libur mingguan karyawan/);
    expect(note.textContent).toMatch(/dikurangi oleh server saat disimpan/);
    expect(note.textContent).toMatch(/belum punya kontrak berlaku/);
  });

  test("sisa jatah yang terlampaui dirender 0 hari, tidak pernah minus", async () => {
    onMockApi();
    await onRenderLoadedEdit();

    await waitFor(() => expect(screen.getByText("0 hari")).toBeTruthy());

    const html = document.body.innerHTML;
    expect(html).not.toContain("-3 hari");
    expect(html).not.toContain("−3 hari");
    expect(
      screen.getByText(/Sudah diambil 14 hari dari jatah 12 hari \(2026\)/),
    ).toBeTruthy();
  });

  test("tipe tanpa batas berbunyi Tanpa batas, bukan '—'", async () => {
    onMockApi({
      quota: {
        karyawan: { name: "Dewi" },
        leaveType: { name: "Cuti Melahirkan" },
        year: 2026,
        maxDaysPerYear: null,
        taken: "66",
        remaining: null,
      },
    });
    await onRenderLoadedEdit();

    await waitFor(() => expect(screen.getByText("Tanpa batas")).toBeTruthy());
  });

  test("terpakai dijelaskan memuat yang masih menunggu", async () => {
    onMockApi();
    await onRenderLoadedEdit();

    await waitFor(() =>
      expect(
        screen.getByText(/termasuk pengajuan yang masih menunggu/),
      ).toBeTruthy(),
    );
  });
});

describe("rentang yang seluruhnya libur", () => {
  test("ditolak sebelum kirim, dengan pesannya", async () => {
    const calls = onMockApi({
      holidays: [
        { date: "2026-05-12", name: "Libur A", type: "NASIONAL" },
        { date: "2026-05-13", name: "Libur B", type: "NASIONAL" },
      ],
    });
    await onRenderLoadedEdit();

    onType("Tanggal selesai", "13/05/2026");

    await waitFor(() =>
      expect(
        screen.getAllByText(/Seluruh rentang ini hari libur/).length,
      ).toBeGreaterThan(0),
    );

    await onSaveConfirmed();

    await waitFor(() =>
      expect(
        screen.getAllByText(/Seluruh rentang ini hari libur/).length,
      ).toBeGreaterThan(0),
    );
    expect(calls.filter((call) => call.method === "PUT")).toEqual([]);
  });

  test("rentang yang masih memuat hari kerja tetap terkirim", async () => {
    const calls = onMockApi({
      holidays: [{ date: "2026-05-12", name: "Libur A", type: "NASIONAL" }],
    });
    await onRenderLoadedEdit();

    onType("Tanggal selesai", "13/05/2026");
    await onSaveConfirmed();

    await waitFor(() =>
      expect(calls.filter((call) => call.method === "PUT").length).toBe(1),
    );
  });
});

describe("simpan", () => {
  test("payload tidak pernah memuat totalDays", async () => {
    const calls = onMockApi();
    await onRenderLoadedEdit();

    await onSaveConfirmed();

    await waitFor(() => expect(calls.length).toBe(1));

    const body = calls[0]?.body as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual([
      "endDate",
      "halfDay",
      "karyawanId",
      "leaveTypeId",
      "reason",
      "startDate",
    ]);
    expect(body.startDate).toBe("2026-05-12");
    expect(body.halfDay).toBe(false);
  });

  test("berhasil: sorotan baris disimpan dan kembali ke daftar yang sama", async () => {
    onMockApi();
    await onRenderLoadedEdit();

    await onSaveConfirmed();

    await waitFor(() =>
      expect(
        window.sessionStorage.getItem(`list-focus:${CUTI_LIST_PATH}`),
      ).toBe("CTI-0006"),
    );
    expect(replaced.at(-1)).toBe(CUTI_LIST_PATH);
  });

  test("409 tumpang-tindih mendarat di Tanggal mulai, bukan di Karyawan", async () => {
    onMockApi({
      save: {
        status: 409,
        error:
          "Karyawan ini sudah memiliki pengajuan cuti pada tanggal yang dipilih. Ubah tanggalnya atau batalkan pengajuan yang lama",
      },
    });
    await onRenderLoadedEdit();

    await onSaveConfirmed();

    await waitFor(() =>
      expect(
        screen.getByText(/sudah memiliki pengajuan cuti pada tanggal/),
      ).toBeTruthy(),
    );
    expect(
      screen.getByLabelText("Tanggal mulai").getAttribute("aria-invalid"),
    ).toBe("true");
  });

  test("galat jaringan tidak membuang isian", async () => {
    globalThis.fetch = (async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      const url = String(input);
      if ((init?.method ?? "GET") === "PUT") throw new Error("offline");

      if (url.includes("/ddl/") || url.includes("/hari-libur/"))
        return Response.json({ status: 200, message: "ok", data: [] });
      if (url.includes("/sisa-jatah"))
        return Response.json({ status: 200, message: "ok", data: QUOTA_SPENT });

      return Response.json({ status: 200, message: "ok", data: DETAIL });
    }) as typeof fetch;

    await onRenderLoadedEdit();
    await onSaveConfirmed();

    await waitFor(() =>
      expect(
        screen.getByText("Data belum tersimpan. Coba simpan lagi."),
      ).toBeTruthy(),
    );
    expect(
      (screen.getByLabelText("Tanggal mulai") as HTMLInputElement).value,
    ).toBe("12/05/2026");
  });
});

describe("setengah hari", () => {
  test("di-disable selama rentangnya lebih dari satu hari", async () => {
    onMockApi();
    await onRenderLoadedEdit();

    const half = screen.getByRole("radio", { name: "Setengah hari" });
    expect(
      half.getAttribute("disabled") !== null ||
        half.getAttribute("aria-disabled") === "true",
    ).toBe(true);
    expect(
      screen.getByText("Setengah hari hanya berlaku untuk cuti satu hari."),
    ).toBeTruthy();
  });

  test("hidup lagi begitu rentangnya satu hari", async () => {
    onMockApi();
    await onRenderLoadedEdit();

    onType("Tanggal selesai", "12/05/2026");

    await waitFor(() =>
      expect(
        screen.queryByText("Setengah hari hanya berlaku untuk cuti satu hari."),
      ).toBeNull(),
    );
  });
});
