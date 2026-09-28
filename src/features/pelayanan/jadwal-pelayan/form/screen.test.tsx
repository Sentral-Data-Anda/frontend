import { Toast } from "@base-ui/react/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  mock,
  test,
} from "bun:test";

import { addDays } from "@/lib/date";
import type { MenuAction } from "@/types/menu";

import { jadwalPelayanMock } from "../../../../../scripts/mock/handlers/jadwal-pelayan";
import { pelayananDdlMock } from "../../../../../scripts/mock/handlers/pelayanan-ddl";
import {
  JADWAL_PELAYAN,
  NEXT_SUNDAY,
  TEMPLATE_JADWAL,
} from "../../../../../scripts/mock/pelayanan-store";
import { onStubViewport } from "../../../../../tests/viewport";

const actions: { current: MenuAction[] } = { current: [] };
const search = { current: "" };
const replaced: string[] = [];
const sent: { method: string; body: unknown }[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({
    replace: (href: string) => replaced.push(href),
    push: () => undefined,
  }),
  usePathname: () => "/pelayanan/jadwal-pelayan/baru",
  useSearchParams: () => new URLSearchParams(search.current),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: actions.current.includes("VIEW"),
    isCanCreate: actions.current.includes("CREATE"),
    isCanUpdate: actions.current.includes("UPDATE"),
    isCanDelete: actions.current.includes("DELETE"),
  }),
}));

const { JadwalPelayanFormScreen } = await import("./screen");

const SNAPSHOT = {
  jadwal: structuredClone(JADWAL_PELAYAN),
  template: structuredClone(TEMPLATE_JADWAL),
};

const BAPEL = [
  { id: 1, code: "BPL-1", name: "Majelis Jemaat" },
  { id: 2, code: "BPL-2", name: "Komisi Pemuda" },
];

const originalFetch = globalThis.fetch;
let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(true);
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "http://mock.test");
    const path = url.pathname.replace(/^\/api\/v1/, "");
    const method = init?.method ?? "GET";

    if (path === "/ddl/bapel") {
      return Response.json({ status: 200, message: "OK", data: BAPEL });
    }
    if (method !== "GET") {
      sent.push({
        method,
        body: init?.body ? JSON.parse(String(init.body)) : null,
      });
    }

    const context = {
      request: new Request(url, { method, body: init?.body }),
      url,
      path,
      method,
      can: () => true,
      isAdmin: true,
      sessionCode: "test",
    };

    return (
      (await pelayananDdlMock(context)) ??
      (await jadwalPelayanMock(context)) ??
      Response.json({ status: 404, error: "Tidak Ditemukan" }, { status: 404 })
    );
  }) as typeof fetch;
});

afterAll(() => {
  viewport.onRestore();
  globalThis.fetch = originalFetch;
});

afterEach(() => {
  cleanup();
  JADWAL_PELAYAN.splice(0, Infinity, ...structuredClone(SNAPSHOT.jadwal));
  TEMPLATE_JADWAL.splice(0, Infinity, ...structuredClone(SNAPSHOT.template));
  delete process.env.MOCK_JADWAL_INACTIVE;
  search.current = "";
  replaced.length = 0;
  sent.length = 0;
  Object.defineProperty(navigator, "clipboard", {
    value: undefined,
    configurable: true,
  });
});

const codeOf = (id: number) =>
  JADWAL_PELAYAN.find((row) => row.id === id)?.code ?? "";

const onRender = (granted: MenuAction[], code?: string) => {
  actions.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <JadwalPelayanFormScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const trigger = (id: string) => document.getElementById(id) as HTMLElement;

const onPick = async (id: string, name: string | RegExp) => {
  fireEvent.click(trigger(id));
  const option = await screen.findByRole("option", { name });

  fireEvent.pointerDown(option);
  fireEvent.click(option);
};

const onSaveConfirmed = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
  fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
};

const onRenderEdit = async (id: number) => {
  onRender(["VIEW", "UPDATE", "DELETE", "CREATE"], codeOf(id));

  await waitFor(() =>
    expect(
      (screen.getByLabelText("Jam mulai") as HTMLInputElement).value,
    ).not.toBe(""),
  );
};

describe("gerbang izin", () => {
  test("tanpa CREATE / UPDATE: NoFormAccess", () => {
    onRender(["VIEW", "UPDATE"]);
    expect(screen.getByText("Tidak bisa menambah jadwal pelayan")).toBeTruthy();

    cleanup();
    onRender(["VIEW", "CREATE"], codeOf(2));
    expect(screen.getByText("Tidak bisa mengubah jadwal pelayan")).toBeTruthy();
    expect(
      screen.getByText("Peran Anda hanya bisa melihat jadwal pelayan."),
    ).toBeTruthy();
  });

  test("kode tidak ada: FormNotFound", async () => {
    onRender(["VIEW", "UPDATE"], "JDL_9999-2026-0001");

    expect(
      await screen.findByText("Data jadwal pelayan tidak ditemukan"),
    ).toBeTruthy();
  });
});

describe("form tambah", () => {
  test("template mengisi jam, nama, dan tugas; ganti template saat ada petugas meminta konfirmasi", async () => {
    onRender(["VIEW", "CREATE"]);

    expect(trigger("templateId").hasAttribute("data-disabled")).toBe(true);
    await onPick("bapelId", "Majelis Jemaat");
    await waitFor(() =>
      expect(trigger("templateId").textContent).toContain("Pilih template"),
    );
    await onPick("templateId", /Ibadah Minggu Pagi/);

    await waitFor(() =>
      expect(
        (screen.getByLabelText("Jam mulai") as HTMLInputElement).value,
      ).toBe("07:30"),
    );
    expect(
      (screen.getByLabelText("Nama jadwal") as HTMLInputElement).value,
    ).toBe("Ibadah Minggu Pagi");
    expect(screen.getAllByText("Tugas")).toHaveLength(8);
    expect(trigger("slots.0.pelayan").textContent).toContain(
      "Isi badan pelayanan, tanggal, dan jam dulu",
    );

    fireEvent.change(trigger("date"), {
      target: { value: addDays(NEXT_SUNDAY, 7).split("-").reverse().join("/") },
    });
    fireEvent.blur(trigger("date"));
    await waitFor(() =>
      expect(trigger("slots.0.pelayan").textContent).toContain("Pilih pelayan"),
    );

    await onPick("slots.0.pelayan", "Andreas Sitanggang");
    await onPick("templateId", /Ibadah Minggu Pagi/);

    expect(
      await screen.findByText(
        "Ganti susunan petugas dengan template Ibadah Minggu Pagi? Petugas yang sudah dipilih akan dikosongkan.",
      ),
    ).toBeTruthy();
  });

  test("ganti tugas mengosongkan pelayan baris itu", async () => {
    onRender(["VIEW", "UPDATE"], codeOf(2));
    await waitFor(() =>
      expect(trigger("slots.0.pelayan").textContent).toContain(
        "Andreas Sitanggang",
      ),
    );

    await onPick("slots.0.roleId", "Kolektan");

    await waitFor(() =>
      expect(trigger("slots.0.pelayan").textContent).toContain("Pilih pelayan"),
    );
  });

  test("salin: tanggal kosong, petugas nonaktif dikosongkan dengan pesan", async () => {
    process.env.MOCK_JADWAL_INACTIVE = "1";
    search.current = `salin=${codeOf(1)}`;
    onRender(["VIEW", "CREATE"]);

    expect(
      await screen.findByText("1 petugas tidak disalin karena sudah nonaktif."),
    ).toBeTruthy();
    expect(
      (screen.getByLabelText("Nama jadwal") as HTMLInputElement).value,
    ).toBe("Pelayan Ibadah Minggu I");
    expect(trigger("templateId")).toBeNull();
    expect(trigger("slots.2.pelayan").textContent).toContain(
      "Bethari Ayu Kusuma (Keyboard)",
    );
  });

  test("salin dari kode yang tidak ada: form kosong dengan pesan", async () => {
    search.current = "salin=JDL_9999";
    onRender(["VIEW", "CREATE"]);

    expect(
      await screen.findByText("Jadwal sumber tidak ditemukan."),
    ).toBeTruthy();
  });
});

describe("form ubah", () => {
  test("opsi yang bentrok nonaktif dengan alasan; petugas sendiri tidak (excludeCode), tapi nonaktif di baris lain", async () => {
    await onRenderEdit(2);

    fireEvent.click(trigger("slots.2.pelayan"));

    const christian = await screen.findByRole("option", {
      name: /Christian Wijaya \(Gitar\)/,
    });

    expect(christian.getAttribute("aria-disabled")).toBe("true");
    expect(christian.textContent).toContain(
      "Terjadwal di Komisi Pemuda 09:00–11:00",
    );
    expect(
      screen
        .getByRole("option", { name: /Bethari Ayu Kusuma/ })
        .getAttribute("aria-disabled"),
    ).toBeNull();

    cleanup();
    await onRenderEdit(2);
    fireEvent.click(trigger("slots.3.pelayan"));

    const taken = await screen.findByRole("option", {
      name: /Bethari Ayu Kusuma/,
    });

    expect(taken.getAttribute("aria-disabled")).toBe("true");
    expect(taken.textContent).toContain("Sudah di petugas 3");
  });

  test("slot (nonaktif) tampil dan tetap terkirim bila tidak diubah; simpan kembali ke daftar", async () => {
    process.env.MOCK_JADWAL_INACTIVE = "1";
    await onRenderEdit(2);

    await waitFor(() =>
      expect(trigger("slots.5.pelayan").textContent).toContain(
        "Kevin Nainggolan (nonaktif)",
      ),
    );
    await onSaveConfirmed();

    await waitFor(() =>
      expect(replaced).toEqual(["/pelayanan/jadwal-pelayan"]),
    );
    expect(
      (sent[0].body as { detail: { pelayanId: number | null }[] }).detail[5]
        .pelayanId,
    ).toBe(10);
    expect((sent[0].body as { makeTemplate: boolean }).makeTemplate).toBe(
      false,
    );
  });

  test("409 bentrok dipetakan ke field Pelayan baris itu, isian utuh", async () => {
    await onRenderEdit(2);

    fireEvent.change(screen.getByLabelText("Jam mulai"), {
      target: { value: "17:00" },
    });
    fireEvent.change(screen.getByLabelText("Jam selesai"), {
      target: { value: "19:00" },
    });
    await onSaveConfirmed();

    expect(
      await screen.findByText(
        /^Lidya Hutagalung sudah terjadwal di Komisi Pemuda Bersama Band Pemuda/,
      ),
    ).toBeTruthy();
    expect(trigger("slots.6.pelayan").getAttribute("aria-invalid")).toBe(
      "true",
    );
    expect((screen.getByLabelText("Jam mulai") as HTMLInputElement).value).toBe(
      "17:00",
    );
    expect(replaced).toEqual([]);
  });

  test("hapus jadwal yang ditaut ibadah: pesan menyebut ibadahnya", async () => {
    await onRenderEdit(1);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    expect(
      await screen.findByText("Jadwal pelayan belum terhapus."),
    ).toBeTruthy();
    expect(
      screen.getByText(/Masih Ditautkan ke Ibadah .+ \(IBD_/),
    ).toBeTruthy();
  });

  test("geser tanggal jadwal yang ditaut ibadah: pesan di Tanggal", async () => {
    await onRenderEdit(1);

    fireEvent.change(trigger("date"), {
      target: { value: NEXT_SUNDAY.split("-").reverse().join("/") },
    });
    fireEvent.blur(trigger("date"));
    await onSaveConfirmed();

    expect(
      await screen.findByText(
        /^Jadwal Pelayan Tidak Lagi Sesuai Dengan Ibadah/,
      ),
    ).toBeTruthy();
  });

  test("Salin untuk WhatsApp: clipboard gagal → teks tampil di dialog", async () => {
    await onRenderEdit(2);

    fireEvent.click(
      screen.getByRole("button", { name: "Salin untuk WhatsApp" }),
    );

    const text = (await screen.findByLabelText(
      "Teks jadwal untuk WhatsApp",
    )) as HTMLTextAreaElement;

    expect(text.value).toContain("*Pelayan Ibadah Minggu I*");
    expect(text.value).toContain("1. Liturgis: Andreas Sitanggang");
    expect(text.value).toContain("4. Pemusik: (belum diisi)");
  });
});
