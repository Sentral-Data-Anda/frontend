import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

mock.module("next/navigation", () => ({
  usePathname: () => "/akun",
}));

const { OfferingSection } = await import("./offering-section");

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

const onMockOfferings = () => {
  const calls: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    calls.push(String(input));

    return Response.json({
      status: 200,
      message: "OK",
      totalData: 1,
      totalPage: 1,
      data: [
        {
          code: "PSB-0050",
          amount: "650000",
          period: "2026-09-01T00:00:00.000Z",
          receivedDate: "2026-09-07T00:00:00.000Z",
          typePersembahan: { name: "Persembahan Bulanan" },
        },
      ],
    });
  }) as typeof fetch;

  return calls;
};

const onRender = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <OfferingSection />
    </QueryClientProvider>,
  );

describe("persembahan tersembunyi sampai diminta", () => {
  test("sebelum Tampilkan: tanpa permintaan jaringan dan tanpa nominal di DOM", () => {
    const calls = onMockOfferings();
    onRender();

    const toggle = screen.getByRole("button", { name: "Tampilkan" });

    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(calls).toEqual([]);
    expect(document.body.textContent).not.toContain("650.000");
  });

  test("Tampilkan mengambil data; Sembunyikan membuang nominal dari DOM", async () => {
    const calls = onMockOfferings();
    onRender();

    fireEvent.click(screen.getByRole("button", { name: "Tampilkan" }));

    await waitFor(() =>
      expect(screen.getAllByText("Rp 650.000").length).toBeGreaterThan(0),
    );
    expect(calls).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Sembunyikan" }));

    expect(document.body.textContent).not.toContain("650.000");
  });
});
