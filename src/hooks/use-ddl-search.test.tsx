import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { useDdlOptions, useDdlSearch } from "./use-ddl-options";

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

const rowsOf = (from: number, count: number) =>
  Array.from({ length: count }, (_, index) => {
    const id = from + index;

    return {
      id,
      code: `JMT-${String(id).padStart(4, "0")}`,
      name: `Jemaat ${id}`,
    };
  });

const onRenderSearch = (requested: string[]) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  function Harness() {
    const ddl = useDdlSearch("jemaat");

    return (
      <div>
        <span data-testid="count">{ddl.options.length}</span>
        <span data-testid="more">{String(ddl.hasMore)}</span>
        <button type="button" onClick={() => ddl.onSearch("a")}>
          Cari
        </button>
        <button type="button" onClick={() => ddl.onLoadMore()}>
          Muat lagi
        </button>
      </div>
    );
  }

  const view = render(
    <QueryClientProvider client={queryClient}>
      <Harness />
    </QueryClientProvider>,
  );

  return { ...view, requested };
};

describe("useDdlSearch — halaman berikutnya", () => {
  test("memuat dengan offset, dan pencarian tidak mematikan muat-lagi", async () => {
    const requested: string[] = [];

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      requested.push(url);

      const parsed = new URL(url, "http://localhost");
      const offset = Number(parsed.searchParams.get("offset") ?? 0);
      const filter = parsed.searchParams.get("filter");

      if (!filter) {
        return Response.json({
          status: 200,
          message: "OK",
          data: rowsOf(1, 20),
        });
      }

      if (offset === 0) {
        return Response.json({
          status: 200,
          message: "OK",
          data: rowsOf(21, 20),
        });
      }

      return Response.json({
        status: 200,
        message: "OK",
        data: rowsOf(41, 5),
      });
    }) as unknown as typeof fetch;

    onRenderSearch(requested);

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("20"),
    );
    expect(screen.getByTestId("more").textContent).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Cari" }));
    await waitFor(() =>
      expect(requested.some((url) => url.includes("filter=a"))).toBe(true),
    );

    fireEvent.click(screen.getByRole("button", { name: "Muat lagi" }));

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("25"),
    );
    expect(
      requested.some(
        (url) => url.includes("filter=a") && url.includes("offset=20"),
      ),
    ).toBe(true);
    expect(screen.getByTestId("more").textContent).toBe("false");
  });
});

describe("useDdlOptions — kembali ke layar semula", () => {
  test("membaca ulang daftar saat komponen dipasang lagi", async () => {
    let calls = 0;

    globalThis.fetch = (async () => {
      calls += 1;

      return Response.json({
        status: 200,
        message: "OK",
        data: [{ id: 1, code: "BPL-0001", name: "Komisi Pemuda" }],
      });
    }) as unknown as typeof fetch;

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const first = renderHook(() => useDdlOptions("bapel"), { wrapper });

    await waitFor(() => expect(first.result.current.options).toHaveLength(1));
    expect(calls).toBe(1);

    first.unmount();

    const second = renderHook(() => useDdlOptions("bapel"), { wrapper });

    await waitFor(() => expect(calls).toBe(2));
    await waitFor(() => expect(second.result.current.options).toHaveLength(1));
  });
});
