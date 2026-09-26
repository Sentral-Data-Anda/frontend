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

import { JEMAAT_LIST_PATH } from "../model";
import type { JemaatDetail } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: (href: string) => replaced.push(href) }),
  usePathname: () => "/kejemaatan/daftar-jemaat/baru",
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: actions.current.includes("VIEW"),
    isCanCreate: actions.current.includes("CREATE"),
    isCanUpdate: actions.current.includes("UPDATE"),
  }),
}));

const { JemaatFormScreen } = await import("./screen");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
});

const onRenderForm = (granted: MenuAction[], code?: string) => {
  actions.current = granted;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <JemaatFormScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

describe("gerbang izin rute form", () => {
  test("tanpa CREATE: rute /baru tidak merender form", () => {
    onRenderForm(["VIEW"]);

    expect(screen.getByText("Tidak bisa menambah jemaat")).toBeTruthy();
    expect(screen.queryByLabelText("Nama lengkap")).toBeNull();
  });

  test("tanpa UPDATE: rute /ubah tidak merender form", () => {
    onRenderForm(["VIEW", "CREATE"], "JMT-0042");

    expect(screen.getByText("Tidak bisa mengubah jemaat")).toBeTruthy();
    expect(screen.queryByLabelText("Nama lengkap")).toBeNull();
  });

  test("dengan CREATE: form tambah dirender", () => {
    onRenderForm(["VIEW", "CREATE"]);

    expect(screen.getByLabelText("Nama lengkap")).toBeTruthy();
  });

  test("dengan UPDATE: form ubah dirender", () => {
    onRenderForm(["VIEW", "UPDATE"], "JMT-0042");

    expect(screen.getByLabelText("Nama lengkap")).toBeTruthy();
  });
});

const DETAIL: JemaatDetail = {
  code: "JMT-0042",
  name: "Maria Sitompul",
  gender: "P",
  birthPlace: "Bandung",
  birthDate: "1990-05-12T00:00:00.000Z",
  email: null,
  phone: null,
  bloodType: null,
  lastEducation: null,
  statusMarital: null,
  professionId: null,
  ethnicGroupId: null,
  zoneChurchId: null,
  codeInduk: null,
  provincesCode: "32",
  regenciesCode: "3273",
  districtsCode: "327301",
  villagesCode: "3273011001",
  address: "Jl. Merdeka 10",
  typeJemaat: "SIMPATISAN",
  statusJemaat: "AKTIF",
  keluargaId: null,
  roleInFamily: null,
  keluargaAsalId: null,
  joinedAt: null,
  additional: [],
};

type SaveFailure = {
  status: number;
  error: string;
  issues?: { path: string; message: string }[];
};

const ZONES = [
  { id: 1, code: "ZON-1", name: "Wilayah I", isActive: true },
  { id: 4, code: "ZON-4", name: "Wilayah IV", isActive: false },
];

const onMockApi = (saveFailure?: SaveFailure, detail = DETAIL) => {
  const saves: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url === "/api/v1/jemaat/JMT-0042" && init?.method === "PUT") {
      saves.push(url);

      if (saveFailure) {
        return Response.json(saveFailure, { status: saveFailure.status });
      }

      return Response.json({
        status: 200,
        message: "Tersimpan",
        data: { code: "JMT-0042" },
      });
    }
    if (url === "/api/v1/jemaat/JMT-0042") {
      return Response.json({ status: 200, message: "OK", data: detail });
    }
    if (url === "/api/v1/ddl/zone-church") {
      return Response.json({ status: 200, message: "OK", data: ZONES });
    }

    return Response.json({
      status: 200,
      message: "OK",
      data: [],
      totalData: 0,
      totalPage: 0,
    });
  }) as typeof fetch;

  return saves;
};

const onRenderLoadedEdit = async (
  granted: MenuAction[] = ["VIEW", "UPDATE"],
) => {
  onRenderForm(granted, "JMT-0042");

  await waitFor(() =>
    expect(
      (screen.getByLabelText("Nama lengkap") as HTMLInputElement).value,
    ).toBe("Maria Sitompul"),
  );
};

describe("konfirmasi sebelum simpan", () => {
  test("Simpan membuka konfirmasi; Tidak menutupnya tanpa memanggil API", async () => {
    const saves = onMockApi();
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() =>
      expect(
        screen.getByText(
          "Apakah Anda ingin menyimpan perubahan data jemaat ini?",
        ),
      ).toBeTruthy(),
    );
    expect(screen.getByText("Konfirmasi Tindakan")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Tidak" }));

    // bun 1.3.14 segfault pada waitFor untuk elemen yang dilepas; ganti setelah naik versi.
    const dialog = screen.queryByRole("alertdialog");
    expect(dialog === null || dialog.hasAttribute("data-closed")).toBe(true);
    expect(saves).toEqual([]);
    expect(replaced).toEqual([]);
  });

  test("form tidak valid: konfirmasi tidak muncul, fokus ke field galat pertama", async () => {
    onMockApi();
    onRenderForm(["VIEW", "CREATE"]);

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(document.activeElement?.id).toBe("name"));
    expect(screen.queryByText(/Apakah Anda ingin menyimpan/)).toBeNull();
  });
});

describe("fokus sesudah simpan ditolak server", () => {
  test("pesan yang dikenal: fokus ke field-nya", async () => {
    onMockApi({ status: 400, error: "Email Sudah Tersedia" });
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(document.activeElement?.id).toBe("email"));
  });

  test("wilayah wajib dari server (400 issues): fokus ke Wilayah", async () => {
    onMockApi({
      status: 400,
      error: "Wilayah Wajib Diisi",
      issues: [
        {
          path: "zoneChurchId",
          message:
            "Keluarga ini belum punya wilayah. Isi wilayah jemaat atau lengkapi wilayah keluarganya.",
        },
      ],
    });
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() =>
      expect(document.activeElement?.id).toBe("zoneChurchId"),
    );
    expect(screen.getByText(/Keluarga ini belum punya wilayah/)).toBeTruthy();
  });

  test("galat tanpa field: fokus ke Simpan, bukan body", async () => {
    onMockApi({ status: 500, error: "Kesalahan server." });
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() =>
      expect(document.activeElement?.textContent).toBe("Simpan"),
    );
  });
});

describe("kembali ke daftar setelah simpan (test wajib 8)", () => {
  test("membawa filter terakhir dan menandai baris yang baru disimpan", async () => {
    const listUrl = `${JEMAAT_LIST_PATH}?status=TIDAK_AKTIF&page=3`;
    window.sessionStorage.setItem(`list-return:${JEMAAT_LIST_PATH}`, listUrl);
    const saves = onMockApi();
    await onRenderLoadedEdit();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([listUrl]));
    expect(saves).toHaveLength(1);
    expect(
      window.sessionStorage.getItem(`list-focus:${JEMAAT_LIST_PATH}`),
    ).toBe("JMT-0042");
  });
});

describe("wilayah mengikuti keluarga", () => {
  test("wilayah nonaktif yang tersimpan tetap tampil dengan penandanya", async () => {
    onMockApi(undefined, { ...DETAIL, zoneChurchId: 4 });
    await onRenderLoadedEdit();

    await waitFor(() =>
      expect(
        (screen.getByLabelText(/^Wilayah/) as HTMLInputElement).value,
      ).toBe("Wilayah IV (nonaktif)"),
    );
  });

  test("berkeluarga: wilayah opsional dengan petunjuk mengikuti keluarga", async () => {
    onMockApi(undefined, {
      ...DETAIL,
      typeJemaat: "ANGGOTA",
      keluargaId: 12,
      roleInFamily: "ANAK",
    });
    await onRenderLoadedEdit();

    expect(
      screen.getByText("Kosongkan untuk mengikuti wilayah keluarga."),
    ).toBeTruthy();
  });
});

describe("tambah pekerjaan baru dari form", () => {
  type MasterReply = { status: number; body: Record<string, unknown> };

  const onMockMaster = (reply: MasterReply) => {
    onMockApi();
    const fallback = globalThis.fetch;
    const professions = [
      { id: 1, code: "PRF-1", name: "Petani" },
      { id: 2, code: "PRF-2", name: "Guru" },
    ];
    const posted: unknown[] = [];

    globalThis.fetch = (async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      const url = String(input);

      if (url === "/api/v1/ddl/profession") {
        return Response.json({ status: 200, message: "OK", data: professions });
      }
      if (url === "/api/v1/profession" && init?.method === "POST") {
        posted.push(JSON.parse(String(init.body)));

        const data = reply.body.data as
          (typeof professions)[number] | undefined;
        if (data && !professions.some((row) => row.id === data.id)) {
          professions.push(data);
        }

        return Response.json(reply.body, { status: reply.status });
      }

      return fallback(input, init);
    }) as typeof fetch;

    return posted;
  };

  const professionInput = () =>
    screen.getByLabelText("Pekerjaan") as HTMLInputElement;

  const onOpenCreate = async (text: string) => {
    const input = professionInput();

    await waitFor(() =>
      expect(input.getAttribute("placeholder")).toBe("Pilih pekerjaan"),
    );
    fireEvent.focus(input);
    fireEvent.input(input, {
      target: { value: text },
      inputType: "insertText",
    });
    fireEvent.click(await screen.findByRole("option", { name: /^Tambah/ }));
    await screen.findByText("Tambah pekerjaan baru?");
  };

  const CAN_CREATE: MenuAction[] = ["VIEW", "CREATE", "UPDATE"];

  test("tanpa CREATE: tidak ada item Tambah", async () => {
    onMockMaster({ status: 201, body: {} });
    await onRenderLoadedEdit();

    const input = professionInput();
    fireEvent.focus(input);
    fireEvent.input(input, {
      target: { value: "tukang las" },
      inputType: "insertText",
    });

    await screen.findByText("Tidak ada yang cocok");
    expect(screen.queryByRole("option", { name: /^Tambah/ })).toBeNull();
  });

  test("saran Maksud Anda mengisi field dengan opsi yang ada tanpa POST", async () => {
    const posted = onMockMaster({ status: 201, body: {} });
    await onRenderLoadedEdit(CAN_CREATE);
    await onOpenCreate("petani sawit");

    expect(screen.getByText("Maksud Anda:")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Petani" }));

    await waitFor(() => expect(professionInput().value).toBe("Petani"));
    expect(posted).toEqual([]);
  });

  test("Tambahkan mengirim POST lalu field terisi pekerjaan baru", async () => {
    const posted = onMockMaster({
      status: 201,
      body: {
        status: 201,
        message: "Berhasil Menambah Pekerjaan",
        data: { id: 3, code: "PFS-0003", name: "Tukang Las" },
      },
    });
    await onRenderLoadedEdit(CAN_CREATE);
    await onOpenCreate("tukang las");

    expect(
      screen.getByText(
        "“Tukang Las” belum ada di daftar. Pekerjaan ini akan bisa dipilih untuk semua jemaat.",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Tambahkan" }));

    await waitFor(() => expect(professionInput().value).toBe("Tukang Las"));
    expect(posted).toEqual([{ name: "Tukang Las" }]);
  });

  test("200 Sudah Ada: field terisi baris yang sudah ada", async () => {
    onMockMaster({
      status: 200,
      body: {
        status: 200,
        message: "Pekerjaan Sudah Ada",
        data: { id: 7, code: "PFS-0007", name: "Tukang Las" },
      },
    });
    await onRenderLoadedEdit(CAN_CREATE);
    await onOpenCreate("tukang las");

    fireEvent.click(screen.getByRole("button", { name: "Tambahkan" }));

    await waitFor(() => expect(professionInput().value).toBe("Tukang Las"));
  });

  test("galat server: pesan di dalam dialog, dialog tetap terbuka, tombol aktif lagi", async () => {
    onMockMaster({
      status: 400,
      body: { status: 400, error: "Nama Pekerjaan minimal 2 karakter" },
    });
    await onRenderLoadedEdit(CAN_CREATE);
    await onOpenCreate("tukang las");

    fireEvent.click(screen.getByRole("button", { name: "Tambahkan" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Nama Pekerjaan minimal 2 karakter",
    );
    expect(screen.getByText("Tambah pekerjaan baru?")).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "Tambahkan" })
        .hasAttribute("disabled"),
    ).toBe(false);
  });
});
