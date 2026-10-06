import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
} from "bun:test";
import type { ReactNode } from "react";

import { ddlKeys } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";

import { onStubViewport } from "../../../../tests/viewport";

import {
  tipeCutiKeys,
  useDeleteTipeCuti,
  useSaveTipeCuti,
  useTipeCutiDetail,
  useTipeCutiList,
} from "./api";

afterEach(cleanup);

let viewport: ReturnType<typeof onStubViewport>;

beforeAll(() => {
  viewport = onStubViewport(true);
});
afterAll(() => viewport.onRestore());

const onParams = (next: Partial<ListState>): ListState => ({
  page: 1,
  limit: 10,
  search: "",
  status: "",
  onSearch: () => {},
  isFiltered: false,
  onApplyFilters: () => {},
  onClearFilters: () => {},
  onPickPage: () => {},
  onPickLimit: () => {},
  onPickFilter: () => {},
  filters: {},
  apiFilters: {},
  ...next,
});

const onWrapper = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return Wrapper;
};

const onNewClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const onStubFetch = (handler: (url: string) => Response) => {
  const original = globalThis.fetch;

  globalThis.fetch = ((input: RequestInfo | URL) =>
    Promise.resolve(handler(String(input)))) as typeof fetch;

  return () => {
    globalThis.fetch = original;
  };
};

const ROW = {
  id: 1,
  publicId: "p-1",
  code: "TCT-0001",
  name: "Cuti Tahunan",
  maxDaysPerYear: 12,
  isPaid: true,
  isActive: true,
};

describe("useTipeCutiList", () => {
  test("search jadi filter, nol param status walau be-sada belum punya", async () => {
    let requested = "";
    const onRestore = onStubFetch((url) => {
      requested = url;

      return Response.json({
        status: 200,
        message: "Berhasil Mendapatkan Tipe Cuti",
        totalData: 1,
        totalPage: 1,
        data: [ROW],
      });
    });

    const { result } = renderHook(
      () => useTipeCutiList(onParams({ search: "tahun", status: "aktif" })),
      { wrapper: onWrapper(onNewClient()) },
    );

    await waitFor(() => expect(result.current.items).toBeDefined());
    onRestore();

    expect(requested).toBe("/api/v1/tipe-cuti?page=1&limit=10&filter=tahun");
    expect(requested).not.toContain("status");
    expect(requested).not.toContain("isActive");
    expect(tipeCutiKeys.lists()[0]).toBe("tipe-cuti");
  });

  // Konvensi rumah, bukan cacat yang diperbaiki fase ini (README §2.8).
  test("404 be-sada jadi daftar kosong yang sukses, bukan galat", async () => {
    const onRestore = onStubFetch(() =>
      Response.json(
        { status: 404, error: "Tipe Cuti Tidak Ditemukan" },
        { status: 404 },
      ),
    );

    const { result } = renderHook(
      () => useTipeCutiList(onParams({ search: "zzz" })),
      { wrapper: onWrapper(onNewClient()) },
    );

    await waitFor(() => expect(result.current.items).toBeDefined());

    expect(result.current.error).toBeNull();
    expect(result.current.items).toEqual([]);

    onRestore();
  });
});

describe("invalidasi sesudah simpan dan hapus", () => {
  const onInvalidated = async (
    run: (code: string) => { mutateAsync: () => Promise<unknown> },
  ) => {
    const queryClient = onNewClient();
    const seeded = [
      tipeCutiKeys.lists(),
      ddlKeys.list("tipe-cuti"),
      ddlKeys.list("tipe-cuti?limit=20"),
      ddlKeys.list("karyawan"),
      ["cuti", "list"],
    ];
    for (const key of seeded) queryClient.setQueryData(key, { data: [] });

    const onRestore = onStubFetch(() =>
      Response.json({ status: 200, message: "OK", data: ROW }),
    );

    const { result } = renderHook(() => run("TCT-0001"), {
      wrapper: onWrapper(queryClient),
    });
    await result.current.mutateAsync();
    onRestore();

    return seeded
      .filter((key) => queryClient.getQueryState(key)?.isInvalidated)
      .map((key) => key.join(" "));
  };

  const EXPECTED = [
    "tipe-cuti list",
    "ddl tipe-cuti",
    "ddl tipe-cuti?limit=20",
  ];

  test("simpan meng-invalidate daftar dan semua ddl tipe-cuti saja", async () => {
    const invalidated = await onInvalidated((code) => {
      const save = useSaveTipeCuti(code);

      return {
        mutateAsync: () =>
          save.mutateAsync({
            name: "Cuti Tahunan",
            maxDaysPerYear: 12,
            isPaid: true,
            isActive: true,
          }),
      };
    });

    expect(invalidated).toEqual(EXPECTED);
  });

  test("hapus meng-invalidate kunci yang sama", async () => {
    const invalidated = await onInvalidated((code) => {
      const remove = useDeleteTipeCuti(code);

      return { mutateAsync: () => remove.mutateAsync() };
    });

    expect(invalidated).toEqual(EXPECTED);
  });
});

// `code` datang dari route param, jadi ia bisa diketik di address bar. Tanpa
// encode, `../` mengubah endpoint yang benar-benar dipanggil — DELETE paling
// tidak enak. Dinyatakan lewat URL yang BENAR-BENAR dikirim, bukan lewat teks
// sumber: assertion teks akan hijau untuk ejaan apa pun yang tidak terbayang.
describe("kode di jalur URL di-encode", () => {
  const onCaptureUrl = async (
    run: (code: string) => { mutateAsync: () => Promise<unknown> },
    code: string,
  ) => {
    let requested = "";
    const onRestore = onStubFetch((url) => {
      requested = url;
      return Response.json({ status: 200, message: "OK", data: ROW });
    });

    const { result } = renderHook(() => run(code), {
      wrapper: onWrapper(onNewClient()),
    });
    await result.current.mutateAsync();
    onRestore();

    return requested;
  };

  const TRAVERSAL = "../../karyawan/KRY-0001";

  test("hapus tidak pernah keluar dari /tipe-cuti", async () => {
    const requested = await onCaptureUrl((code) => {
      const remove = useDeleteTipeCuti(code);

      return { mutateAsync: () => remove.mutateAsync() };
    }, TRAVERSAL);

    expect(requested).toBe("/api/v1/tipe-cuti/..%2F..%2Fkaryawan%2FKRY-0001");
    expect(
      new URL(requested, "http://x").pathname.startsWith("/api/v1/tipe-cuti/"),
    ).toBe(true);
  });

  test("simpan tidak pernah keluar dari /tipe-cuti", async () => {
    const requested = await onCaptureUrl((code) => {
      const save = useSaveTipeCuti(code);

      return {
        mutateAsync: () =>
          save.mutateAsync({
            name: "Cuti Tahunan",
            maxDaysPerYear: 12,
            isPaid: true,
            isActive: true,
          }),
      };
    }, TRAVERSAL);

    expect(
      new URL(requested, "http://x").pathname.startsWith("/api/v1/tipe-cuti/"),
    ).toBe(true);
  });

  test("baca detail tidak pernah keluar dari /tipe-cuti", async () => {
    let requested = "";
    const onRestore = onStubFetch((url) => {
      requested = url;
      return Response.json({ status: 200, message: "OK", data: ROW });
    });

    const { result } = renderHook(() => useTipeCutiDetail(TRAVERSAL), {
      wrapper: onWrapper(onNewClient()),
    });
    await waitFor(() => expect(result.current.data).toBeDefined());
    onRestore();

    expect(
      new URL(requested, "http://x").pathname.startsWith("/api/v1/tipe-cuti/"),
    ).toBe(true);
  });

  test("spasi dan tanda tanya tidak membelah jalur atau jadi query", async () => {
    const requested = await onCaptureUrl((code) => {
      const remove = useDeleteTipeCuti(code);

      return { mutateAsync: () => remove.mutateAsync() };
    }, "TCT 1?limit=99");

    const url = new URL(requested, "http://x");
    expect(url.search).toBe("");
    expect(url.pathname).toBe("/api/v1/tipe-cuti/TCT%201%3Flimit%3D99");
  });
});
