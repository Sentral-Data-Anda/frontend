import { Toast } from "@base-ui/react/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { MenuAction } from "@/types/menu";

import { fasilitasMock } from "../../../../scripts/mock/handlers/fasilitas";
import { inventarisMock } from "../../../../scripts/mock/handlers/inventaris";
import { pengadaanMock } from "../../../../scripts/mock/handlers/pengadaan";
import { pesananPembelianMock } from "../../../../scripts/mock/handlers/pesanan-pembelian";
import type { MockContext, MockHandler } from "../../../../scripts/mock/kit";
import {
  PURCHASE_ORDER,
  purchaseRequestByCode,
  purchaseRequestView,
} from "../../../../scripts/mock/pengadaan-store";

export type Call = { method: string; path: string; body: unknown };

export const grants: { current: Record<string, MenuAction[]> } = {
  current: {},
};

export const ALL: MenuAction[] = ["VIEW", "CREATE", "UPDATE", "DELETE"];

export const accessOf = (slug: string) => {
  const actions = grants.current[slug] ?? [];

  return {
    isCanView: actions.includes("VIEW"),
    isCanCreate: actions.includes("CREATE"),
    isCanUpdate: actions.includes("UPDATE"),
    isCanDelete: actions.includes("DELETE"),
  };
};

const requestDetailMock: MockHandler = (ctx) => {
  const match = ctx.path.match(/^\/permintaan-pembelian\/([^/]+)$/);
  if (!match || ctx.method !== "GET") return null;

  const row = purchaseRequestByCode(decodeURIComponent(match[1] ?? ""));

  return row
    ? Response.json({
        status: 200,
        message: "OK",
        data: purchaseRequestView(row, true),
      })
    : Response.json(
        { status: 404, error: "Permintaan Pembelian Tidak Ditemukan" },
        { status: 404 },
      );
};

const HANDLERS = [
  pesananPembelianMock,
  requestDetailMock,
  pengadaanMock,
  inventarisMock,
  fasilitasMock,
];

const SNAPSHOT = structuredClone(PURCHASE_ORDER);

export const restoreOrders = () =>
  PURCHASE_ORDER.splice(0, Infinity, ...structuredClone(SNAPSHOT));

export function onStubOrderFetch(
  calls: Call[],
  override: { current: ((call: Call) => Response | null) | null },
) {
  const original = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "http://mock.test");
    const path = url.pathname.replace(/^\/api\/v1/, "");
    const method = init?.method ?? "GET";
    const call = {
      method,
      path: `${path}${url.search}`,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    };

    calls.push(call);
    const forced = override.current?.(call);

    if (forced) return forced;

    const context: MockContext = {
      request: new Request(url, {
        method,
        body: init?.body ? String(init.body) : undefined,
      }),
      url,
      path,
      method,
      can: () => true,
      isAdmin: true,
      sessionCode: "test",
    };

    for (const handler of HANDLERS) {
      const response = await handler(context);

      if (response) return response;
    }

    return Response.json(
      { status: 404, error: "Tidak Ditemukan" },
      { status: 404 },
    );
  }) as typeof fetch;

  return () => {
    globalThis.fetch = original;
  };
}

export const renderWithQuery = (node: ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <Toast.Provider>{node}</Toast.Provider>
    </QueryClientProvider>,
  );

  return queryClient;
};

export const orderAt = (index: number) => {
  const row = PURCHASE_ORDER[index];

  if (!row) throw new Error(`Pesanan seed #${index} tidak ada`);

  return row;
};
