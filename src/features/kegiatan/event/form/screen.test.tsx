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

import { eventMock } from "../../../../../scripts/mock/handlers/event";
import { EVENT } from "../../../../../scripts/mock/kegiatan-store";
import { EVENT_LIST_PATH } from "../model";

const actions: { current: MenuAction[] } = { current: [] };
const registrationActions: { current: MenuAction[] } = { current: [] };
const replaced: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({
    replace: (href: string) => replaced.push(href),
    push: () => undefined,
  }),
  usePathname: () => "/kegiatan/event/baru",
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: (slug: string) => {
    const granted =
      slug === "PENDAFTARAN_EVENT"
        ? registrationActions.current
        : actions.current;

    return {
      isCanView: granted.includes("VIEW"),
      isCanCreate: granted.includes("CREATE"),
      isCanUpdate: granted.includes("UPDATE"),
      isCanDelete: granted.includes("DELETE"),
    };
  },
}));

const { EventFormScreen } = await import("./screen");

const RETRET = EVENT.find((row) => row.name === "Retret Pemuda")!.code;
const originalFetch = globalThis.fetch;

type Sent = { method: string; url: string; body: FormData };

const onMockApi = (save?: Response) => {
  const sent: Sent[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "http://mock.test");
    const method = init?.method ?? "GET";

    if (url.pathname.startsWith("/api/v1/ddl/")) {
      return Response.json({
        status: 200,
        message: "OK",
        data: [
          { id: 1, code: "A", name: "Gedung Gereja" },
          { id: 2, code: "B", name: "Komisi Pemuda" },
        ],
      });
    }
    if (method === "PUT" || method === "POST") {
      sent.push({ method, url: url.pathname, body: init?.body as FormData });
      if (save) return save;
    }

    return eventMock({
      request: new Request(url, init),
      url,
      path: url.pathname.replace(/^\/api\/v1/, ""),
      method,
      can: () => true,
      isAdmin: true,
      sessionCode: "test",
    }) as Promise<Response>;
  }) as typeof fetch;

  return sent;
};

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();
  replaced.length = 0;
  registrationActions.current = [];
});

const onRenderForm = (granted: MenuAction[], code?: string) => {
  actions.current = granted;
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <Toast.Provider>
        <EventFormScreen code={code} />
      </Toast.Provider>
    </QueryClientProvider>,
  );

  return queryClient;
};

const onRenderRetret = async (granted: MenuAction[] = ["UPDATE"]) => {
  const queryClient = onRenderForm(["VIEW", ...granted], RETRET);

  await waitFor(() =>
    expect((screen.getByLabelText("Nama") as HTMLInputElement).value).toBe(
      "Retret Pemuda",
    ),
  );

  return queryClient;
};

const onSaveConfirmed = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
  await waitFor(() =>
    expect(
      screen.getByText("Apakah Anda ingin menyimpan perubahan data event ini?"),
    ).toBeTruthy(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Ya" }));
};

describe("gerbang izin", () => {
  test("tambah tanpa CREATE dan ubah tanpa UPDATE: NoFormAccess", () => {
    onMockApi();
    onRenderForm(["VIEW"]);
    expect(screen.getByText("Tidak bisa menambah event")).toBeTruthy();

    cleanup();
    onRenderForm(["VIEW", "CREATE"], RETRET);
    expect(screen.getByText("Tidak bisa mengubah event")).toBeTruthy();
    expect(screen.queryByLabelText("Nama")).toBeNull();
  });

  test("Hapus hanya dengan DELETE; Lihat pendaftar hanya dengan VIEW pendaftaran", async () => {
    onMockApi();
    await onRenderRetret(["UPDATE"]);
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Lihat pendaftar" })).toBeNull();

    cleanup();
    registrationActions.current = ["VIEW"];
    await onRenderRetret(["UPDATE", "DELETE"]);
    expect(screen.getByRole("button", { name: "Hapus" })).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Lihat pendaftar" })
        .getAttribute("href"),
    ).toBe("/kegiatan/pendaftaran-event?event=2");
  });

  test("kode tidak ada: FormNotFound", async () => {
    onMockApi();
    onRenderForm(["VIEW", "UPDATE"], "EVN_9999-2026-0001");

    await screen.findByRole("link", { name: "Kembali ke Event" });
    expect(screen.queryByLabelText("Nama")).toBeNull();
  });
});

describe("form ubah berpendaftar", () => {
  test("harga terkunci dan kapasitas memberi batas", async () => {
    onMockApi();
    await onRenderRetret();

    const price = screen.getByLabelText("Harga") as HTMLInputElement;

    expect(price.disabled).toBe(true);
    expect(price.value).toBe("350.000");
    expect(
      screen.getByText("Tidak bisa diubah karena sudah ada 3 pendaftar."),
    ).toBeTruthy();
    expect(screen.getByText("Minimal 3, sudah ada 3 pendaftar.")).toBeTruthy();
    expect(screen.getByText("3 dari 40 kursi terisi")).toBeTruthy();
  });

  test("refetch berkala tidak menimpa isian yang sudah diubah", async () => {
    onMockApi();
    const queryClient = await onRenderRetret();
    const name = screen.getByLabelText("Nama") as HTMLInputElement;

    fireEvent.change(name, { target: { value: "Retret Pemuda Akbar" } });
    await queryClient.refetchQueries({
      queryKey: ["event", "detail", RETRET],
    });

    await waitFor(() => expect(name.value).toBe("Retret Pemuda Akbar"));
  });

  test("simpan: PUT multipart tanpa foto, sorot baris, kembali, invalidasi daftar", async () => {
    const listUrl = `${EVENT_LIST_PATH}?status=terbit`;
    window.sessionStorage.setItem(`list-return:${EVENT_LIST_PATH}`, listUrl);
    const sent = onMockApi(
      Response.json({
        status: 200,
        message: "Berhasil Memperbarui Event",
        data: { code: RETRET },
      }),
    );
    const queryClient = await onRenderRetret();
    queryClient.setQueryData(["event", "list", "beranda"], { data: [] });

    await onSaveConfirmed();

    await waitFor(() => expect(replaced).toEqual([listUrl]));
    expect(sent).toHaveLength(1);
    expect(sent[0].url).toBe(`/api/v1/event/${RETRET}`);
    expect(sent[0].body.get("isPaid")).toBe("1");
    expect(sent[0].body.get("price")).toBe("350000");
    expect(sent[0].body.get("isIndoor")).toBe("0");
    expect(sent[0].body.has("mainImage")).toBe(false);
    expect(window.sessionStorage.getItem(`list-focus:${EVENT_LIST_PATH}`)).toBe(
      RETRET,
    );
    expect(
      queryClient.getQueryState(["event", "list", "beranda"])?.isInvalidated,
    ).toBe(true);
  });

  test("issue image dari server tampil di foto utama, isian tetap", async () => {
    onMockApi(
      Response.json(
        {
          status: 400,
          error: "Mohon Lengkapi Foto Utama",
          issues: [{ path: "image", message: "Mohon Lengkapi Foto Utama" }],
        },
        { status: 400 },
      ),
    );
    await onRenderRetret();

    await onSaveConfirmed();

    await screen.findByText("Mohon Lengkapi Foto Utama");
    expect(replaced).toEqual([]);
    expect((screen.getByLabelText("Nama") as HTMLInputElement).value).toBe(
      "Retret Pemuda",
    );
  });

  test("hapus event berpendaftar: penolakan server di FormAlert", async () => {
    onMockApi();
    await onRenderRetret(["UPDATE", "DELETE"]);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    await screen.findByText("Apakah Anda ingin menghapus data event ini?");
    fireEvent.click(screen.getByRole("button", { name: "Ya" }));

    await screen.findByText(
      "Event Tidak Dapat Dihapus Karena Sudah Memiliki 3 Pendaftar",
    );
    expect(screen.getByText("Event belum terhapus.")).toBeTruthy();
    expect(replaced).toEqual([]);
  });
});
