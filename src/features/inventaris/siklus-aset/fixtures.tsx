import { Toast } from "@base-ui/react/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import { fasilitasMock } from "../../../../scripts/mock/handlers/fasilitas";
import { inventarisMock } from "../../../../scripts/mock/handlers/inventaris";
import { siklusAsetMock } from "../../../../scripts/mock/handlers/siklus-aset";
import {
  ASSET,
  DISPOSAL,
  MAINTENANCE,
  TRANSFER,
} from "../../../../scripts/mock/inventaris-store";
import { ddlRows } from "../../../../scripts/mock-dashboard";

const SNAPSHOT = structuredClone({ ASSET, DISPOSAL, MAINTENANCE, TRANSFER });

export const restoreCycleStore = () => {
  ASSET.splice(0, Infinity, ...structuredClone(SNAPSHOT.ASSET));
  DISPOSAL.splice(0, Infinity, ...structuredClone(SNAPSHOT.DISPOSAL));
  MAINTENANCE.splice(0, Infinity, ...structuredClone(SNAPSHOT.MAINTENANCE));
  TRANSFER.splice(0, Infinity, ...structuredClone(SNAPSHOT.TRANSFER));
};

export type Call = { method: string; path: string; body: unknown };

export function onStubCycleFetch(calls: Call[]) {
  const original = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "http://mock.test");
    const path = url.pathname.replace(/^\/api\/v1/, "");
    const method = init?.method ?? "GET";

    calls.push({
      method,
      path: `${path}${url.search}`,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });

    if (path === "/ddl/bapel") {
      return Response.json({
        status: 200,
        message: "OK",
        data: ddlRows("bapel", url.searchParams),
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

    return ((await siklusAsetMock(context)) ??
      (await inventarisMock(context)) ??
      (await fasilitasMock(context))) as Response;
  }) as typeof fetch;

  return () => {
    globalThis.fetch = original;
  };
}

export const renderWithClient = (node: ReactNode) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <Toast.Provider>{node}</Toast.Provider>
      </QueryClientProvider>,
    ),
  };
};

export const assetIdOf = (name: string) =>
  ASSET.find((row) => row.name === name)?.id ?? 0;
