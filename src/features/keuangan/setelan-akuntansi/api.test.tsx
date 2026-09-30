import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";
import type { ReactNode } from "react";

import { settingKeys, useSaveSetting, useSettingList } from "./api";

afterEach(cleanup);

const onWrapper = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return Wrapper;
};

const onNewClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const ROWS = [
  { key: "PERSEMBAHAN_KAS", description: "Kas", account: null },
  { key: "PERSEMBAHAN_BANK", description: "Bank", account: null },
];

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

describe("useSettingList", () => {
  test("membaca seluruh kunci tanpa paginasi, kunci cache accounting-setting", async () => {
    let requested = "";
    const onRestore = onStubFetch((url) => {
      requested = url;

      return Response.json({
        status: 200,
        message: "OK",
        totalData: 2,
        totalPage: 1,
        data: ROWS,
      });
    });

    const { result } = renderHook(() => useSettingList(), {
      wrapper: onWrapper(onNewClient()),
    });

    await waitFor(() => expect(result.current.settings.length).toBe(2));
    onRestore();

    expect(requested).toBe("/api/v1/setelan-akuntansi");
    expect(settingKeys.all[0]).toBe("accounting-setting");
  });
});

describe("useSaveSetting", () => {
  test("kosongkan mengirim PUT accountId null dan meng-invalidate accounting-setting", async () => {
    const queryClient = onNewClient();
    queryClient.setQueryData(settingKeys.list(), { data: ROWS });

    const bodies: unknown[] = [];
    const onRestore = onStubFetch((url, init) => {
      bodies.push({ url, method: init?.method, body: String(init?.body) });

      return Response.json({ status: 200, message: "OK", data: ROWS[0] });
    });

    const { result } = renderHook(() => useSaveSetting("PERSEMBAHAN_KAS"), {
      wrapper: onWrapper(queryClient),
    });

    await result.current.mutateAsync({ accountId: null });
    onRestore();

    expect(bodies).toEqual([
      {
        url: "/api/v1/setelan-akuntansi/PERSEMBAHAN_KAS",
        method: "PUT",
        body: '{"accountId":null}',
      },
    ]);
    expect(queryClient.getQueryState(settingKeys.list())?.isInvalidated).toBe(
      true,
    );
  });
});
