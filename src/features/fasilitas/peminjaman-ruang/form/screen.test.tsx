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

import { addDays, todayJakarta, toInputText, weekdayIndex } from "@/lib/date";
import { formatDate, formatWeekday } from "@/lib/format";
import type { MenuAction } from "@/types/menu";

import { LOAN_LIST_PATH } from "../model";
import type { CheckResult, LoanRoomDetail, RoomBooking } from "../types";

const actions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({
    replace: (href: string) => replaced.push(href),
    push: () => undefined,
  }),
  usePathname: () => "/fasilitas/peminjaman-ruang/baru",
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

const { LoanFormScreen } = await import("./screen");

const TODAY = todayJakarta();
const CODE = "LR_0002_0005-2026-0009";

const DETAIL: LoanRoomDetail = {
  publicId: "p-1",
  code: CODE,
  date: `${addDays(TODAY, 3)}T00:00:00.000Z`,
  startTime: "19:00",
  endTime: "21:00",
  purpose: "Latihan paduan suara",
  room: { id: 2, code: "RM-0002", name: "Aula Serbaguna" },
  bapel: { id: 5, code: "BPL-5", name: "Komisi Musik" },
  jemaat: { id: 2, code: "JMT-0002", name: "Bethari Ayu Kusuma" },
};

const BOOKING: RoomBooking[] = [
  {
    kind: "IBADAH",
    code: "IBD-1",
    name: "Ibadah Minggu I",
    startTime: "17:00",
    endTime: "19:30",
    bapel: null,
  },
  {
    kind: "LOAN",
    code: CODE,
    name: "Latihan paduan suara",
    startTime: "19:00",
    endTime: "21:00",
    bapel: { name: "Komisi Musik" },
  },
  {
    kind: "EVENT",
    code: "EVN-1",
    name: "Bazar Natal",
    startTime: "20:30",
    endTime: "23:59",
    bapel: null,
  },
  {
    kind: "LOAN",
    code: "LR-X",
    name: "Rapat pagi",
    startTime: "08:00",
    endTime: "10:00",
    bapel: null,
  },
];

type Reply = { status: number; body: unknown };

const oneClash = (dates: string[]): Reply => ({
  status: 200,
  body: {
    data: dates.map((date, index): CheckResult => ({
      date,
      clashes:
        index === 1
          ? [
              {
                kind: "IBADAH",
                code: "IBD-2",
                name: "Ibadah Minggu I",
                startTime: "07:00",
                endTime: "09:00",
              },
            ]
          : [],
    })),
  },
});

const api: {
  detail: Reply;
  booking: Reply;
  check: (dates: string[]) => Reply;
  write: Reply;
  calls: { method: string; path: string; body: unknown }[];
} = {
  detail: { status: 200, body: { data: DETAIL } },
  booking: { status: 200, body: { data: BOOKING } },
  check: oneClash,
  write: { status: 200, body: { message: "OK", data: { code: CODE } } },
  calls: [],
};

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
  api.calls.length = 0;
  api.detail = { status: 200, body: { data: DETAIL } };
  api.booking = { status: 200, body: { data: BOOKING } };
  api.check = oneClash;
  api.write = { status: 200, body: { message: "OK", data: { code: CODE } } };
});

const reply = ({ status, body }: Reply) =>
  Response.json({ status, ...(body as object) }, { status });

const onMockApi = () => {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "http://mock.test");
    const path = url.pathname.replace(/^\/api\/v1/, "");
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;

    api.calls.push({ method, path: `${path}${url.search}`, body });

    if (path === "/ddl/room") {
      return reply({
        status: 200,
        body: {
          data: [
            { id: 2, code: "RM-0002", name: "Aula Serbaguna", isActive: true },
            { id: 1, code: "RM-0001", name: "Gedung Gereja", isActive: true },
            {
              id: 5,
              code: "RM-0005",
              name: "Kelas Sekolah Minggu",
              isActive: false,
            },
          ],
        },
      });
    }
    if (path === "/ddl/bapel") {
      return reply({
        status: 200,
        body: { data: [{ id: 5, code: "BPL-5", name: "Komisi Musik" }] },
      });
    }
    if (path === "/ddl/jemaat") {
      return reply({
        status: 200,
        body: { data: [{ id: 3, code: "JMT-0003", name: "Christian Wijaya" }] },
      });
    }
    if (path === "/loan-room/booking") return reply(api.booking);
    if (path === "/loan-room/check") return reply(api.check(body.dates));
    if (method === "GET") return reply(api.detail);

    return reply(api.write);
  }) as typeof fetch;
};

const onRender = (granted: MenuAction[], code?: string) => {
  actions.current = granted;
  onMockApi();

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Toast.Provider>
        <LoanFormScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );
};

const input = (id: string) => document.getElementById(id) as HTMLInputElement;

const onType = (id: string, value: string) => {
  fireEvent.change(input(id), { target: { value } });
  fireEvent.blur(input(id));
};

const onPick = async (id: string, name: string) => {
  await waitFor(() => expect(input(id).disabled).toBe(false));
  fireEvent.click(input(id));

  const option = await screen.findByRole("option", { name });

  fireEvent.pointerDown(option);
  fireEvent.click(option);
};

const onSaveConfirm = async (label: RegExp | string = "Simpan") => {
  fireEvent.click(screen.getByRole("button", { name: label }));
  fireEvent.click(await screen.findByRole("button", { name: "Ya" }));
};

const bookingCalls = () =>
  api.calls.filter((call) => call.path.startsWith("/loan-room/booking")).length;

describe("gerbang", () => {
  test("tanpa CREATE / UPDATE: NoFormAccess tanpa memanggil peminjaman", () => {
    onRender(["VIEW"]);
    expect(screen.getByText("Tidak bisa menambah peminjaman")).toBeTruthy();

    cleanup();
    onRender(["VIEW", "CREATE"], CODE);
    expect(screen.getByText("Tidak bisa mengubah peminjaman")).toBeTruthy();
    expect(
      api.calls.filter((call) => call.path.startsWith("/loan-room")),
    ).toHaveLength(0);
  });

  test("404 ubah → FormNotFound", async () => {
    api.detail = { status: 404, body: { error: "Peminjaman Tidak Ditemukan" } };
    onRender(["VIEW", "UPDATE"], CODE);

    expect(
      await screen.findByText("Data peminjaman tidak ditemukan"),
    ).toBeTruthy();
  });
});

describe("form ubah", () => {
  test("tanpa bagian Ulangi; jadwal tanpa dirinya, Bentrok untuk ibadah dan event", async () => {
    onRender(["VIEW", "UPDATE", "DELETE"], CODE);

    await screen.findByText(/^Jadwal Aula Serbaguna, /);
    expect(screen.queryByText("Tiap minggu")).toBeNull();
    await screen.findByText("Bazar Natal");
    expect(screen.queryAllByText("Latihan paduan suara")).toHaveLength(0);
    expect(screen.getAllByText("Bentrok")).toHaveLength(2);
    expect(
      screen.getByText("19.00–21.00 bentrok dengan 2 jadwal"),
    ).toBeTruthy();
  });

  test("jadwal gagal dimuat tidak menahan simpan", async () => {
    api.booking = { status: 500, body: { error: "Kesalahan server." } };
    onRender(["VIEW", "UPDATE"], CODE);

    expect(
      await screen.findByText("Jadwal ruang belum bisa dimuat."),
    ).toBeTruthy();
    await onSaveConfirm();
    await waitFor(() => expect(replaced).toEqual([LOAN_LIST_PATH]));
  });

  test("409 bentrok: pesan server apa adanya di Jam mulai + jadwal dimuat ulang", async () => {
    const message = "Ruang Sudah Dipakai Ibadah Minggu I Pukul 17.00–19.30";

    api.write = {
      status: 409,
      body: { error: message, issues: [{ path: "startTime", message }] },
    };
    onRender(["VIEW", "UPDATE"], CODE);
    await screen.findByText("Bazar Natal");

    const before = bookingCalls();

    await onSaveConfirm();

    expect(await screen.findByText(message)).toBeTruthy();
    expect(input("startTime").getAttribute("aria-invalid")).toBe("true");
    await waitFor(() => expect(bookingCalls()).toBeGreaterThan(before));
    expect(replaced).toHaveLength(0);
  });

  test("PUT membawa body JSON; sukses → saveListFocus + kembali ke daftar", async () => {
    onRender(["VIEW", "UPDATE"], CODE);
    await screen.findByText("Bazar Natal");
    await onSaveConfirm();

    await waitFor(() => expect(replaced).toEqual([LOAN_LIST_PATH]));
    expect(api.calls.find((call) => call.method === "PUT")?.body).toEqual({
      roomId: 2,
      date: addDays(TODAY, 3),
      startTime: "19:00",
      endTime: "21:00",
      purpose: "Latihan paduan suara",
      jemaatId: 2,
      bapelId: 5,
    });
    expect(window.sessionStorage.getItem(`list-focus:${LOAN_LIST_PATH}`)).toBe(
      CODE,
    );
  });

  test("hapus lewat preset dengan teks khusus", async () => {
    onRender(["VIEW", "UPDATE", "DELETE"], CODE);
    await screen.findByText("Bazar Natal");

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    expect(
      await screen.findByText(/Peminjaman lain pada minggu berikutnya/),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await waitFor(() => expect(replaced).toEqual([LOAN_LIST_PATH]));
    expect(api.calls.some((call) => call.method === "DELETE")).toBe(true);
  });

  test("peminjaman lampau hanya-baca: tanpa Simpan dan Hapus", async () => {
    api.detail = {
      status: 200,
      body: {
        data: { ...DETAIL, date: `${addDays(TODAY, -3)}T00:00:00.000Z` },
      },
    };
    onRender(["VIEW", "UPDATE", "DELETE"], CODE);

    expect(await screen.findByText("Peminjaman ini sudah lewat.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Simpan" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
    expect(input("startTime").disabled).toBe(true);
  });
});

describe("tambah tiap minggu", () => {
  const START = addDays(TODAY, 7);

  const onWeekly = async () => {
    onRender(["VIEW", "CREATE"]);
    await onPick("roomId", "Aula Serbaguna");
    onType("date", toInputText(START));
    fireEvent.change(input("startTime"), { target: { value: "19:00" } });
    fireEvent.change(input("endTime"), { target: { value: "21:00" } });
    fireEvent.change(input("purpose"), { target: { value: "Latihan band" } });
    fireEvent.click(screen.getByText("Tiap minggu"));
    onType("until", toInputText(addDays(START, 21)));
    await screen.findByText(
      "3 dari 4 tanggal akan disimpan · 1 bentrok dilewati",
    );
  };

  const ticks = () =>
    [...document.querySelectorAll('input[id^="repeat-row-"]')].map(
      (tick) => tick as HTMLInputElement,
    );

  test("hari terisi dari tanggal mulai; ringkasan menyebut hari, jam, rentang, dan jumlah", async () => {
    await onWeekly();

    const weekday = formatWeekday(START);

    expect(
      (screen.getByRole("checkbox", { name: weekday }) as HTMLInputElement)
        .checked,
    ).toBe(true);
    expect(
      screen.getByText(
        `Tiap ${weekday}, pukul 19.00–21.00, ${formatDate(START)} s.d. ${formatDate(addDays(START, 21))} · 4 kali.`,
      ),
    ).toBeTruthy();
  });

  test("tambah hari kedua: tanggal bertambah dan ringkasan menyebut keduanya", async () => {
    await onWeekly();

    const other = addDays(START, 2);
    const second = formatWeekday(other);
    // Ringkasan mengurutkan hari menurut urutan pekan (Senin dulu), bukan
    // urutan pilih — pasangan ini terbalik kalau START jatuh di akhir pekan.
    const [early, late] =
      weekdayIndex(START) < weekdayIndex(other)
        ? [formatWeekday(START), second]
        : [second, formatWeekday(START)];

    fireEvent.click(screen.getByRole("checkbox", { name: second }));

    expect(
      await screen.findByText(
        `Tiap ${early} dan ${late}, pukul 19.00–21.00, ${formatDate(START)} s.d. ${formatDate(addDays(START, 21))} · 7 kali.`,
      ),
    ).toBeTruthy();
  });

  test("bentrok tidak bisa dicentang; lepas centang; input berubah = dibuat ulang", async () => {
    await onWeekly();

    expect(ticks().map((tick) => [tick.checked, tick.disabled])).toEqual([
      [true, false],
      [false, true],
      [true, false],
      [true, false],
    ]);
    expect(
      screen.getByText("Bentrok: Ibadah Minggu I 07.00–09.00"),
    ).toBeTruthy();

    fireEvent.click(ticks()[2]);
    expect(
      screen.getByText("2 dari 4 tanggal akan disimpan · 1 bentrok dilewati"),
    ).toBeTruthy();

    const checks = api.calls.filter((call) => call.path === "/loan-room/check");

    fireEvent.change(input("endTime"), { target: { value: "20:30" } });
    await screen.findByText(
      "3 dari 4 tanggal akan disimpan · 1 bentrok dilewati",
    );
    expect(
      api.calls.filter((call) => call.path === "/loan-room/check").length,
    ).toBeGreaterThan(checks.length);
  });

  test("pemeriksaan gagal menahan simpan", async () => {
    api.check = () => ({ status: 500, body: { error: "Kesalahan server." } });
    onRender(["VIEW", "CREATE"]);
    await onPick("roomId", "Aula Serbaguna");
    onType("date", toInputText(START));
    fireEvent.change(input("startTime"), { target: { value: "19:00" } });
    fireEvent.change(input("endTime"), { target: { value: "21:00" } });
    fireEvent.click(screen.getByText("Tiap minggu"));
    onType("until", toInputText(addDays(START, 21)));

    expect(
      await screen.findByText("Bentrok belum bisa diperiksa."),
    ).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Simpan" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  test("400 per baris → baris pratinjau yang benar; 409 → FormAlert", async () => {
    api.check = (dates) => ({
      status: 200,
      body: { data: dates.map((date) => ({ date, clashes: [] })) },
    });
    api.write = {
      status: 400,
      body: {
        error: "Bentrok Dengan Baris 1",
        issues: [{ path: "rows.2.startTime", message: "Ruang Tidak Aktif X" }],
      },
    };
    onRender(["VIEW", "CREATE"]);
    await onPick("roomId", "Aula Serbaguna");
    onType("date", toInputText(START));
    fireEvent.change(input("startTime"), { target: { value: "19:00" } });
    fireEvent.change(input("endTime"), { target: { value: "21:00" } });
    fireEvent.change(input("purpose"), { target: { value: "Latihan band" } });
    fireEvent.focus(input("jemaatId"));
    fireEvent.input(input("jemaatId"), {
      target: { value: "Chr" },
      inputType: "insertText",
    });
    const person = await screen.findByRole("option", {
      name: "Christian Wijaya",
    });
    fireEvent.pointerDown(person);
    fireEvent.click(person);
    fireEvent.click(screen.getByText("Tiap minggu"));
    onType("until", toInputText(addDays(START, 21)));
    await screen.findByText(
      "4 dari 4 tanggal akan disimpan · 0 bentrok dilewati",
    );
    fireEvent.click(ticks()[1]);

    await onSaveConfirm(/^Simpan 3 peminjaman/);

    expect(await screen.findByText("Ruang Tidak Aktif X")).toBeTruthy();
    expect(ticks()[3].getAttribute("aria-invalid")).toBe("true");
    expect(
      api.calls.find((call) => call.path === "/loan-room/batch")?.body,
    ).toMatchObject({
      rows: [
        { date: START },
        { date: addDays(START, 14) },
        { date: addDays(START, 21) },
      ],
    });

    api.write = { status: 409, body: { error: "Ruang Sudah Dipakai" } };
    await onSaveConfirm(/^Simpan 3 peminjaman/);
    expect(
      await screen.findByText(
        "Ada jadwal yang baru saja terisi; periksa ulang bentrok.",
      ),
    ).toBeTruthy();
    expect(replaced).toHaveLength(0);
  });
});
