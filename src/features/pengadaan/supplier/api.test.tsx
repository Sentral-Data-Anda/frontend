import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";
import type { ReactNode } from "react";

import { ddlKeys } from "@/hooks/use-ddl-options";

import { supplierKeys, useDeleteSupplier, useSaveSupplier } from "./api";
import type { Supplier } from "./types";

afterEach(cleanup);

const onWrapper = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return Wrapper;
};

const onStubFetch = (
  handler: (url: string, init?: RequestInit) => Response,
) => {
  const original = globalThis.fetch;

  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) =>
    Promise.resolve(handler(String(input), init))) as typeof fetch;

  return () => {
    globalThis.fetch = original;
  };
};

const ROW = { code: "SUP-0005", name: "Toko Buku Agape" } as Supplier;

describe("invalidasi sesudah simpan dan hapus", () => {
  const onInvalidated = async (
    run: (code: string) => { mutateAsync: () => Promise<unknown> },
  ) => {
    const queryClient = new QueryClient();
    const seeded = [
      supplierKeys.lists(),
      supplierKeys.detail("SUP-0005"),
      ddlKeys.list("supplier"),
      ddlKeys.list("supplier?limit=20"),
      ddlKeys.list("room"),
      ["purchase-order", "list"],
    ];
    for (const key of seeded) queryClient.setQueryData(key, { data: [] });

    const requests: string[] = [];
    const onRestore = onStubFetch((url, init) => {
      requests.push(`${init?.method} ${url}`);

      return Response.json({ status: 200, message: "OK", data: ROW });
    });

    const { result } = renderHook(() => run("SUP-0005"), {
      wrapper: onWrapper(queryClient),
    });
    await result.current.mutateAsync();
    onRestore();

    return {
      requests,
      invalidated: seeded
        .filter((key) => queryClient.getQueryState(key)?.isInvalidated)
        .map((key) => key.join(" ")),
    };
  };

  const EXPECTED = [
    "supplier list",
    "supplier detail SUP-0005",
    "ddl supplier",
    "ddl supplier?limit=20",
  ];

  test("simpan: PUT /supplier/:code, invalidasi supplier + ddl supplier saja", async () => {
    const { requests, invalidated } = await onInvalidated((code) => {
      const save = useSaveSupplier(code);

      return { mutateAsync: () => save.mutateAsync({} as never) };
    });

    expect(requests).toEqual(["PUT /api/v1/supplier/SUP-0005"]);
    expect(invalidated).toEqual(EXPECTED);
  });

  test("hapus: DELETE, kunci yang sama", async () => {
    const { requests, invalidated } = await onInvalidated((code) => {
      const remove = useDeleteSupplier(code);

      return { mutateAsync: () => remove.mutateAsync() };
    });

    expect(requests).toEqual(["DELETE /api/v1/supplier/SUP-0005"]);
    expect(invalidated).toEqual(EXPECTED);
  });
});
