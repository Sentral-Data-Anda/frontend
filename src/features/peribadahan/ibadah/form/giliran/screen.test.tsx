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
import type { ReactNode } from "react";

import { addDays, todayJakarta, toInputText } from "@/lib/date";
import type { MenuAction } from "@/types/menu";

const access: { ibadah: MenuAction[]; keluarga: MenuAction[] } = {
  ibadah: [],
  keluarga: [],
};
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({
    replace: (href: string) => replaced.push(href),
    push: () => undefined,
  }),
  usePathname: () => "/peribadahan/ibadah/giliran",
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: (slug: string) => {
    const granted = slug === "KELUARGA" ? access.keluarga : access.ibadah;

    return {
      isCanView: granted.includes("VIEW"),
      isCanCreate: granted.includes("CREATE"),
      isCanUpdate: granted.includes("UPDATE"),
      isCanDelete: granted.includes("DELETE"),
    };
  },
}));

const { GiliranScreen } = await import("./screen");
const { IbadahListScreen } = await import("../../list");

const TODAY = todayJakarta();
const LATEST = addDays(TODAY, 10);
const START = addDays(LATEST, 7);

const TYPES = [
  { id: 1, code: "TYP_IBD-0001", name: "Ibadah Minggu I", isActive: true },
  { id: 6, code: "TYP_IBD-0006", name: "Ibadah Wilayah", isActive: true },
];

const ZONES = [
  { id: 1, code: "ZC-0001", name: "Wilayah I", isActive: true },
  { id: 3, code: "ZC-0003", name: "Wilayah III", isActive: true },
];

const SUGGESTIONS = [
  { id: 23, code: "KK-0023", name: "Keluarga Sembiring", lastHostedDate: null },
  { id: 1, code: "KK-0001", name: "Keluarga Sitanggang", lastHostedDate: null },
];

type Failure = {
  status: number;
  error: string;
  issues?: { path: string; message: string }[];
};

const ok = (data: unknown, message = "OK", status = 200) =>
  Response.json({ status, message, data }, { status });

const fail = (failure: Failure) =>
  Response.json(failure, { status: failure.status });

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  replaced.length = 0;
});

const onMockApi = (save?: Failure) => {
  const posted: { rows: Record<string, unknown>[] }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "http://mock.test");
    const path = url.pathname.replace(/^\/api\/v1/, "");
    const query = url.searchParams;
    const address = /^\/ddl\/keluarga\/(\d+)\/alamat$/.exec(path);

    if (init?.method === "POST") {
      posted.push(JSON.parse(String(init.body)));

      return save
        ? fail(save)
        : ok(
            { codes: ["IBD_0006-2026-0101", "IBD_0006-2026-0102"] },
            "Berhasil Membuat 2 Data Ibadah",
            201,
          );
    }
    if (address) {
      return ok({
        id: Number(address[1]),
        address: `Jl. Rumah ${address[1]}`,
        zoneChurch: null,
      });
    }
    if (path === "/ddl/type-ibadah") return ok(TYPES);
    if (path === "/ddl/zone-church") return ok(ZONES);
    if (path === "/ddl/keluarga") return ok(SUGGESTIONS);
    if (path === "/ibadah/saran-tuan-rumah") {
      return query.get("zoneChurchId") === "1"
        ? ok(SUGGESTIONS)
        : fail({
            status: 404,
            error:
              "Tidak Ada Keluarga Yang Dapat Menjadi Tuan Rumah di Wilayah Ini",
          });
    }
    if (path === "/ibadah" && query.get("limit") === "1") {
      return ok([
        {
          date: `${LATEST}T00:00:00.000Z`,
          startTime: "19:00",
          endTime: "20:30",
        },
      ]);
    }
    if (path === "/ibadah" && query.get("startDate")) {
      return ok([{ date: `${addDays(START, 7)}T00:00:00.000Z` }]);
    }

    return fail({ status: 404, error: "Tidak Ditemukan" });
  }) as typeof fetch;

  return posted;
};

const wrap = (children: ReactNode) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    <Toast.Provider>{children}</Toast.Provider>
  </QueryClientProvider>
);

const onRender = (
  ibadah: MenuAction[] = ["VIEW", "CREATE"],
  keluarga: MenuAction[] = ["VIEW"],
) => {
  access.ibadah = ibadah;
  access.keluarga = keluarga;

  return render(wrap(<GiliranScreen />));
};

const valueOf = (label: string) =>
  (screen.getByLabelText(label) as HTMLInputElement).value;

const onPick = async (id: string, name: string) => {
  await waitFor(() =>
    expect((document.getElementById(id) as HTMLButtonElement).disabled).toBe(
      false,
    ),
  );
  fireEvent.click(document.getElementById(id) as HTMLElement);

  const option = await screen.findByRole("option", { name });

  fireEvent.pointerDown(option);
  fireEvent.click(option);
};

const onSettings = async (zone = "Wilayah I") => {
  await onPick("typeIbadahId", "Ibadah Wilayah");
  await onPick("zoneChurchId", zone);
  await waitFor(() => expect(valueOf("Jam selesai")).toBe("20:30"));
};

const onBuild = async () => {
  await onSettings();
  fireEvent.change(screen.getByLabelText("Jumlah ibadah"), {
    target: { value: "3" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Buat pratinjau" }));
  await screen.findByText("2 ibadah akan dibuat · 1 dilewati");
};

const hostInputs = () =>
  screen.getAllByLabelText(/^Tuan rumah /) as HTMLInputElement[];

const ticks = () => screen.getAllByRole("checkbox") as HTMLInputElement[];

describe("gerbang izin", () => {
  test("tanpa CREATE: NoFormAccess, tanpa memanggil be-sada", () => {
    const posted = onMockApi();
    onRender(["VIEW"]);

    expect(screen.getByText("Tidak bisa menyusun jadwal giliran")).toBeTruthy();
    expect(
      screen.getByText("Peran Anda tidak bisa menambah ibadah."),
    ).toBeTruthy();
    expect(screen.queryByLabelText("Tipe ibadah")).toBeNull();
    expect(posted).toHaveLength(0);
  });

  test("tombol header daftar hanya dengan CREATE", async () => {
    onMockApi();
    access.ibadah = ["VIEW"];
    render(wrap(<IbadahListScreen />));
    await screen.findByText("Belum ada ibadah tercatat");
    expect(
      screen.queryByRole("link", { name: "Buat jadwal giliran" }),
    ).toBeNull();

    cleanup();
    access.ibadah = ["VIEW", "CREATE"];
    render(wrap(<IbadahListScreen />));
    expect(
      screen
        .getByRole("link", { name: "Buat jadwal giliran" })
        .getAttribute("href"),
    ).toBe("/peribadahan/ibadah/giliran");
  });
});

describe("pengaturan", () => {
  test("bawaan dari ibadah terakhir tanpa menimpa field yang disentuh", async () => {
    onMockApi();
    onRender();

    fireEvent.change(screen.getByLabelText("Jam mulai"), {
      target: { value: "18:00" },
    });
    await onSettings();

    expect(valueOf("Jam mulai")).toBe("18:00");
    expect(valueOf("Tanggal mulai")).toBe(toInputText(START));
  });

  test("pratinjau: giliran melompati baris Sudah ada, pengaturan terkunci; Ubah pengaturan bersih langsung, kotor lewat dialog", async () => {
    onMockApi();
    onRender();
    await onBuild();

    expect(ticks().map((tick) => tick.checked)).toEqual([true, false, true]);
    expect(screen.getByText("Sudah ada")).toBeTruthy();
    await waitFor(() =>
      expect(hostInputs().map((input) => input.value)).toEqual([
        "Keluarga Sembiring",
        "",
        "Keluarga Sitanggang",
      ]),
    );
    expect(
      (document.getElementById("typeIbadahId") as HTMLButtonElement).disabled,
    ).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Ubah pengaturan" }));
    expect(screen.queryByText(/ibadah akan dibuat/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Buat pratinjau" }));
    await screen.findByText("2 ibadah akan dibuat · 1 dilewati");
    fireEvent.click(ticks()[0]);
    expect(screen.getByText("1 ibadah akan dibuat · 2 dilewati")).toBeTruthy();
    expect(hostInputs()[2].value).toBe("Keluarga Sitanggang");

    fireEvent.click(screen.getByRole("button", { name: "Ubah pengaturan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
    await waitFor(() =>
      expect(screen.queryByText(/ibadah akan dibuat/)).toBeNull(),
    );
  });

  test("saran kosong: EmptyState dengan tautan Keluarga, atau pesan tanpa izin", async () => {
    onMockApi();
    onRender();
    await onSettings("Wilayah III");
    fireEvent.click(screen.getByRole("button", { name: "Buat pratinjau" }));

    expect(
      await screen.findByText(
        "Belum ada keluarga di wilayah ini yang bisa menjadi tuan rumah",
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Buka Keluarga" }).getAttribute("href"),
    ).toBe("/kejemaatan/keluarga");

    cleanup();
    onMockApi();
    onRender(["VIEW", "CREATE"], []);
    await onSettings("Wilayah III");
    fireEvent.click(screen.getByRole("button", { name: "Buat pratinjau" }));
    expect(
      await screen.findByText(
        /Minta pengurus Kejemaatan melengkapi data keluarga/,
      ),
    ).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Buka Keluarga" })).toBeNull();
  });
});

describe("simpan", () => {
  const onSaveConfirm = async () => {
    await waitFor(() =>
      expect(screen.getAllByText(/^Jl\. Rumah/)).toHaveLength(2),
    );
    fireEvent.click(screen.getByRole("button", { name: "Simpan 2 ibadah" }));
    expect(
      await screen.findByText(
        "Simpan 2 ibadah Ibadah Wilayah di Wilayah I? Semua tersimpan sekaligus; tuan rumah dan alamat bisa diubah per ibadah sesudahnya.",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));
  };

  test("dialog → POST batch baris tercentang → daftar terfilter", async () => {
    const posted = onMockApi();
    onRender();
    await onBuild();
    await onSaveConfirm();

    await waitFor(() =>
      expect(replaced).toEqual(["/peribadahan/ibadah?tipe=6&wilayah=1"]),
    );
    expect(
      posted[0].rows.map((row) => [row.date, row.hostKeluargaId, row.address]),
    ).toEqual([
      [START, 23, "Jl. Rumah 23"],
      [addDays(START, 14), 1, "Jl. Rumah 1"],
    ]);
  });

  test("400 per baris: indeks body dipetakan ke baris pratinjau, pratinjau utuh", async () => {
    onMockApi({
      status: 400,
      error: "Keluarga Tuan Rumah Tidak Ditemukan",
      issues: [
        {
          path: "rows.1.hostKeluargaId",
          message: "Keluarga Tuan Rumah Tidak Ditemukan",
        },
      ],
    });
    onRender();
    await onBuild();
    await onSaveConfirm();

    expect(
      await screen.findByText(
        "Keluarga ini sudah dihapus. Pilih keluarga lain.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("1 baris perlu diperbaiki.")).toBeTruthy();
    expect(hostInputs()[2].getAttribute("aria-invalid")).toBe("true");
    expect(hostInputs()[0].getAttribute("aria-invalid")).toBeNull();
    expect(screen.getByText("2 ibadah akan dibuat · 1 dilewati")).toBeTruthy();
    expect(replaced).toHaveLength(0);
  });

  test("409 berlomba: alert + Buat ulang pratinjau, pratinjau tetap", async () => {
    onMockApi({
      status: 409,
      error:
        "Ibadah dengan tipe, tanggal, jam mulai dan wilayah yang sama sudah tercatat. Isi Wilayah jika ibadah ini untuk wilayah yang berbeda",
    });
    onRender();
    await onBuild();
    await onSaveConfirm();

    expect(
      await screen.findByRole("button", { name: "Buat ulang pratinjau" }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Ada ibadah yang baru saja tercatat oleh orang lain; buat ulang pratinjau.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("2 ibadah akan dibuat · 1 dilewati")).toBeTruthy();
  });

  test("tuan rumah kosong ditahan sebelum dialog", async () => {
    const posted = onMockApi();
    onRender();
    await onBuild();

    fireEvent.click(ticks()[1]);
    fireEvent.click(screen.getByRole("button", { name: "Simpan 3 ibadah" }));

    expect(await screen.findByText("Pilih tuan rumah.")).toBeTruthy();
    expect(screen.getByText("1 baris perlu diperbaiki.")).toBeTruthy();
    expect(screen.queryByText("Konfirmasi Tindakan")).toBeNull();
    expect(posted).toHaveLength(0);
  });
});
