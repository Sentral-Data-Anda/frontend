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
import { addDays, todayJakarta } from "@/lib/date";
import type { MenuAction } from "@/types/menu";

import type { Cuti } from "../types";

const grants: { current: Partial<Record<string, MenuAction[]>> } = {
  current: {},
};
const replaced: string[] = [];

/**
 * Hari ini diambil dari helper yang layarnya pakai, lalu tanggal uji
 * diturunkan RELATIF terhadapnya. `Date.now` tidak bisa dipalsukan di sini:
 * `todayJakarta` memanggil `new Date()`, yang tidak membacanya — stub jam
 * akan hijau karena alasan yang salah di sebagian besar tanggal.
 */
const TODAY = todayJakarta();

const BESOK = addDays(TODAY, 2);

const KEMARIN = addDays(TODAY, -9);

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/sdm/cuti/CTI-0001",
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

const { CutiDetailScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

const REASON =
  "Mendampingi ibu kontrol ke rumah sakit setiap Selasa selama empat minggu, karena tidak ada saudara lain yang bisa menemani dan jadwal kontrolnya tidak bisa dipindah.";

const DETAIL: Cuti = {
  id: 1,
  publicId: "cti-1",
  code: "CTI-0001",
  karyawanId: 1,
  leaveTypeId: 1,
  startDate: "2026-05-12T00:00:00.000Z",
  endDate: "2026-05-16T00:00:00.000Z",
  totalDays: "5",
  reason: REASON,
  status: "PENDING",
  rejectedReason: null,
  approvedAt: null,
  karyawan: {
    publicId: "kry-1",
    code: "KRY-0001",
    name: "Ani Wijaya",
    position: "Sekretaris",
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

const QUOTA_SPENT = {
  karyawan: { name: "Ani Wijaya" },
  leaveType: { name: "Cuti Tahunan" },
  year: 2026,
  maxDaysPerYear: 12,
  taken: "14",
  remaining: "0",
};

const onMockApi = (
  options: { detail?: Cuti; quota?: Record<string, unknown> } = {},
) => {
  const calls: { method: string; url: string }[] = [];
  const quotaUrls: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url.includes("/cuti/sisa-jatah")) {
      quotaUrls.push(url);
      return Response.json({
        status: 200,
        message: "ok",
        data: options.quota ?? QUOTA_SPENT,
      });
    }

    if (method !== "GET") {
      calls.push({ method, url });
      return Response.json({ status: 200, message: "Berhasil", data: {} });
    }

    return Response.json({
      status: 200,
      message: "ok",
      data: options.detail ?? DETAIL,
    });
  }) as typeof fetch;

  return Object.assign(calls, { quotaUrls });
};

const onRender = (
  granted: Partial<Record<string, MenuAction[]>>,
  code = "CTI-0001",
) => {
  grants.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <CutiDetailScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  replaced.length = 0;
});

describe("gerbang izin detail", () => {
  test("tanpa CUTI VIEW: keadaan tanpa akses, tanpa permintaan", () => {
    let isFetched = false;
    globalThis.fetch = (() => {
      isFetched = true;
      return Promise.resolve(Response.json({}));
    }) as unknown as typeof fetch;

    onRender({});

    expect(screen.getByText("Anda tidak memiliki akses ke Cuti")).toBeTruthy();
    expect(isFetched).toBe(false);
  });

  test("tanpa UPDATE: Ajukan dan Ubah tidak ada di DOM", async () => {
    onMockApi();
    onRender({ [MENU.CUTI]: ["VIEW"] });

    await screen.findByText(REASON);
    expect(
      screen.queryByRole("button", { name: "Ajukan untuk persetujuan" }),
    ).toBeNull();
    expect(screen.queryByRole("link", { name: "Ubah" })).toBeNull();
  });

  test("tanpa DELETE: Hapus tidak ada di DOM", async () => {
    onMockApi();
    onRender({ [MENU.CUTI]: ["VIEW", "UPDATE"] });

    await screen.findByText(REASON);
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Ajukan untuk persetujuan" }),
    ).toBeTruthy();
  });

  test("UPDATE atas menu LAIN tidak membuka aksi cuti", async () => {
    onMockApi();
    onRender({
      [MENU.CUTI]: ["VIEW"],
      [MENU.PERMINTAAN_PERSETUJUAN]: ["VIEW", "UPDATE"],
    });

    await screen.findByText(REASON);
    expect(
      screen.queryByRole("button", { name: "Ajukan untuk persetujuan" }),
    ).toBeNull();
  });
});

describe("§0.3 no. 4 — detail satu-satunya tempat alasan hidup", () => {
  test("alasan dirender penuh, tidak dipotong", async () => {
    onMockApi();
    const view = onRender({ [MENU.CUTI]: ["VIEW"] });

    const node = await screen.findByText(REASON);

    expect(node.textContent).toBe(REASON);
    expect(node.textContent).not.toContain("…");
    expect(view.container.innerHTML).toContain("tidak bisa dipindah.");
  });

  test("alasan penolakan dirender penuh dari kolom rejectedReason", async () => {
    const refusal = "y".repeat(250);
    onMockApi({
      detail: { ...DETAIL, status: "REJECTED", rejectedReason: refusal },
    });
    onRender({ [MENU.CUTI]: ["VIEW"] });

    const node = await screen.findByText(refusal);
    expect(node.textContent).toBe(refusal);
  });

  test("penolakan tanpa catatan dikatakan, bukan dibiarkan kosong", async () => {
    onMockApi({ detail: { ...DETAIL, status: "REJECTED" } });
    onRender({ [MENU.CUTI]: ["VIEW"] });

    expect(await screen.findByText(/tidak disertai catatan/)).toBeTruthy();
  });
});

describe("sisa jatah tidak pernah negatif DI LAYAR", () => {
  test("jatah yang terlampaui dirender 0 hari, dengan hitungan jujurnya", async () => {
    onMockApi();
    const view = onRender({ [MENU.CUTI]: ["VIEW"] });

    await waitFor(() => expect(screen.getByText("0 hari")).toBeTruthy());

    expect(
      screen.getByText("Sudah diambil 14 hari dari jatah 12 hari (2026)"),
    ).toBeTruthy();

    const html = view.container.innerHTML;
    expect(html).not.toContain("-2 hari");
    expect(html).not.toContain("−2 hari");
    expect(html).not.toMatch(/[-−]\d+(,\d+)? hari/);
  });

  test("jatah ditanyakan untuk tahun MULAI permintaan, bukan tahun berjalan", async () => {
    const calls = onMockApi({
      detail: {
        ...DETAIL,
        startDate: "2027-01-04T00:00:00.000Z",
        endDate: "2027-01-08T00:00:00.000Z",
      },
    });
    onRender({ [MENU.CUTI]: ["VIEW"] });

    await waitFor(() => expect(calls.quotaUrls.length).toBeGreaterThan(0));

    expect(
      new URL(calls.quotaUrls[0] ?? "", "http://localhost").searchParams.get(
        "year",
      ),
    ).toBe("2027");
  });

  test("tanpa batas tetap Tanpa batas", async () => {
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
    onRender({ [MENU.CUTI]: ["VIEW"] });

    await waitFor(() => expect(screen.getByText("Tanpa batas")).toBeTruthy());
    expect(screen.getByText("Sudah diambil 66 hari (2026)")).toBeTruthy();
  });
});

describe("tombol Batalkan dan tanggal mulai", () => {
  const approved = (startDate: string): Cuti => ({
    ...DETAIL,
    status: "APPROVED",
    startDate: `${startDate}T00:00:00.000Z`,
    endDate: `${startDate}T00:00:00.000Z`,
    approvedAt: "2026-05-01T03:00:00.000Z",
  });

  test("tampil saat cuti mulai SESUDAH hari ini", async () => {
    onMockApi({ detail: approved(BESOK) });
    onRender({ [MENU.CUTI]: ["VIEW", "UPDATE", "DELETE"] });

    expect(
      await screen.findByRole("button", { name: "Batalkan cuti" }),
    ).toBeTruthy();
  });

  test("hilang saat cuti mulai HARI INI", async () => {
    onMockApi({ detail: approved(TODAY) });
    onRender({ [MENU.CUTI]: ["VIEW", "UPDATE", "DELETE"] });

    await screen.findByText(REASON);
    expect(screen.queryByRole("button", { name: "Batalkan cuti" })).toBeNull();
  });

  test("hilang saat cuti sudah lewat", async () => {
    onMockApi({ detail: approved(KEMARIN) });
    onRender({ [MENU.CUTI]: ["VIEW", "UPDATE", "DELETE"] });

    await screen.findByText(REASON);
    expect(screen.queryByRole("button", { name: "Batalkan cuti" })).toBeNull();
  });

  test("cuti yang disetujui tidak menawarkan Ubah atau Hapus", async () => {
    onMockApi({ detail: approved(BESOK) });
    onRender({ [MENU.CUTI]: ["VIEW", "UPDATE", "DELETE"] });

    await screen.findByText(REASON);
    expect(screen.queryByRole("link", { name: "Ubah" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });
});

describe("persetujuan", () => {
  const withApproval: Cuti = {
    ...DETAIL,
    approval: {
      publicId: "apr-1",
      code: "APR-0201",
      status: "PENDING",
      currentOrder: 1,
      steps: [
        {
          order: 1,
          approverRoleName: "Sekretaris Jemaat",
          status: "PENDING",
          note: null,
          actedAt: null,
          actor: null,
        },
        {
          order: 2,
          approverRoleName: "Majelis Jemaat",
          status: "PENDING",
          note: null,
          actedAt: null,
          actor: null,
        },
      ],
    },
  };

  test("panel jejak dirender saat approval ada, dengan tahap dan nomor", async () => {
    onMockApi({ detail: withApproval });
    onRender({ [MENU.CUTI]: ["VIEW"] });

    expect(await screen.findByText("APR-0201")).toBeTruthy();
    expect(screen.getByText("Sekretaris Jemaat")).toBeTruthy();
    expect(screen.getByText("Menunggu persetujuan (1 dari 2)")).toBeTruthy();
  });

  test("tanpa PERMINTAAN_PERSETUJUAN VIEW: kodenya teks, bukan tautan", async () => {
    onMockApi({ detail: withApproval });
    onRender({ [MENU.CUTI]: ["VIEW"] });

    await screen.findByText("APR-0201");
    expect(screen.queryByRole("link", { name: "APR-0201" })).toBeNull();
  });

  test("dengan PERMINTAAN_PERSETUJUAN VIEW: kodenya bertaut", async () => {
    onMockApi({ detail: withApproval });
    onRender({
      [MENU.CUTI]: ["VIEW"],
      [MENU.PERMINTAAN_PERSETUJUAN]: ["VIEW"],
    });

    expect(await screen.findByRole("link", { name: "APR-0201" })).toBeTruthy();
  });

  test("nol tombol setujui/tolak: SDM tidak menandatangani (§3)", async () => {
    onMockApi({ detail: withApproval });
    onRender({
      [MENU.CUTI]: ["VIEW", "UPDATE", "DELETE"],
      [MENU.PERMINTAAN_PERSETUJUAN]: ["VIEW", "UPDATE"],
    });

    await screen.findByText("APR-0201");
    expect(screen.queryByRole("button", { name: /Setujui/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Tolak/i })).toBeNull();
  });

  test("sedang ditandatangani menutup Ajukan, Ubah, dan Hapus", async () => {
    onMockApi({ detail: withApproval });
    onRender({ [MENU.CUTI]: ["VIEW", "UPDATE", "DELETE"] });

    await screen.findByText(REASON);
    expect(
      screen.queryByRole("button", { name: "Ajukan untuk persetujuan" }),
    ).toBeNull();
    expect(screen.queryByRole("link", { name: "Ubah" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });

  // be-sada `9b94577` belum mengirim `approval` di jalur baca cuti (SC-FE1).
  // Yang dijaga di sini: layar turun ke status polos, bukan ke panel kosong,
  // dan aksinya tetap ditawarkan.
  test("tanpa approval di kawat: nol panel persetujuan, aksi tetap hidup", async () => {
    const { approval: _omitted, ...withoutApproval } = DETAIL;
    onMockApi({ detail: withoutApproval as Cuti });
    onRender({ [MENU.CUTI]: ["VIEW", "UPDATE", "DELETE"] });

    await screen.findByText(REASON);
    expect(screen.queryByText("Persetujuan")).toBeNull();
    expect(screen.queryByText(/Sedang ditandatangani/)).toBeNull();
    expect(screen.getByText("Menunggu")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Ajukan untuk persetujuan" }),
    ).toBeTruthy();
  });
});

describe("aksi", () => {
  test("Ajukan dikonfirmasi lewat preset bersama sebelum dikirim", async () => {
    const calls = onMockApi();
    onRender({ [MENU.CUTI]: ["VIEW", "UPDATE"] });

    fireEvent.click(
      await screen.findByRole("button", { name: "Ajukan untuk persetujuan" }),
    );

    expect(screen.getByText("Konfirmasi Tindakan")).toBeTruthy();
    expect(
      screen.getByText(/mengirim pengajuan cuti ini untuk ditandatangani/),
    ).toBeTruthy();
    expect(calls.length).toBe(0);

    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(calls.length).toBe(1));
    expect(calls[0]).toEqual({
      method: "POST",
      url: "/api/v1/cuti/CTI-0001/pengajuan",
    });
  });

  test("Batalkan memakai kalimatnya sendiri, bukan kalimat Hapus", async () => {
    onMockApi({
      detail: {
        ...DETAIL,
        status: "APPROVED",
        startDate: `${BESOK}T00:00:00.000Z`,
        endDate: `${BESOK}T00:00:00.000Z`,
      },
    });
    onRender({ [MENU.CUTI]: ["VIEW", "UPDATE", "DELETE"] });

    fireEvent.click(
      await screen.findByRole("button", { name: "Batalkan cuti" }),
    );

    expect(screen.getByText(/Harinya kembali ke jatah karyawan/)).toBeTruthy();
    expect(screen.queryByText(/ingin menghapus data/)).toBeNull();
  });

  test("Hapus memakai kalimat hapus dan kembali ke daftar", async () => {
    const calls = onMockApi();
    onRender({ [MENU.CUTI]: ["VIEW", "UPDATE", "DELETE"] });

    fireEvent.click(await screen.findByRole("button", { name: "Hapus" }));
    expect(
      screen.getByText(/ingin menghapus data pengajuan cuti ini/),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(calls.length).toBe(1));
    expect(calls[0]?.method).toBe("DELETE");
    await waitFor(() => expect(replaced.at(-1)).toBe("/sdm/cuti"));
  });

  test("kode di URL dilewatkan encodeURIComponent", async () => {
    const calls = onMockApi();
    onRender({ [MENU.CUTI]: ["VIEW", "UPDATE"] }, "CTI 0001/../rahasia");

    fireEvent.click(
      await screen.findByRole("button", { name: "Ajukan untuk persetujuan" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(calls.length).toBe(1));
    expect(calls[0]?.url).toBe(
      "/api/v1/cuti/CTI%200001%2F..%2Frahasia/pengajuan",
    );
  });
});

describe("nol ekspor dan nol prompt password (§0.3)", () => {
  test("tidak ada tombol ekspor, unduh, atau cetak", async () => {
    onMockApi();
    onRender({ [MENU.CUTI]: ["VIEW", "UPDATE", "DELETE"] });

    await screen.findByText(REASON);

    for (const label of [/ekspor/i, /unduh/i, /download/i, /cetak/i, /csv/i]) {
      expect(screen.queryByRole("button", { name: label })).toBeNull();
      expect(screen.queryByRole("link", { name: label })).toBeNull();
    }
  });

  test("tidak ada prompt password: Cuti nol angka gaji", async () => {
    onMockApi();
    onRender({ [MENU.CUTI]: ["VIEW"] });

    await screen.findByText(REASON);
    expect(screen.queryByLabelText(/password/i)).toBeNull();
    expect(screen.queryByText("Data gaji")).toBeNull();
  });
});
