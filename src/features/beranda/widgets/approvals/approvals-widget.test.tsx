import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import type { ApprovalItem } from "../../api";

import { ApprovalsWidget } from "./approvals-widget";

afterEach(cleanup);

const item = (
  overrides: Partial<ApprovalItem> & Pick<ApprovalItem, "code">,
): ApprovalItem => ({
  publicId: `uuid-${overrides.code}`,
  documentType: "CASH_EXPENSE",
  amount: "4500000",
  submittedAt: "2026-10-05T03:10:00.000Z",
  currentOrder: 1,
  steps: [{ order: 1, approverBapel: { name: "Badan Pelayanan Pemuda" } }],
  ...overrides,
});

const renderWidget = (items: ApprovalItem[]) => {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  client.setQueryData(["persetujuan", "menunggu-saya"], {
    data: items,
    totalData: items.length,
  });

  return render(
    <QueryClientProvider client={client}>
      <ApprovalsWidget />
    </QueryClientProvider>,
  );
};

test("cuti tampil dalam hari, bukan rupiah", () => {
  renderWidget([
    item({ code: "PST-2026-0001", documentType: "LEAVE_REQUEST", amount: "3" }),
  ]);

  expect(screen.getAllByText("3 hari").length).toBeGreaterThan(0);
  expect(screen.queryByText(/Rp\s*3\b/)).toBeNull();
});

test("dokumen uang tetap dalam rupiah", () => {
  renderWidget([item({ code: "PST-2026-0002" })]);

  expect(screen.getAllByText(/Rp\s*4\.500\.000/).length).toBeGreaterThan(0);
});

test("tiap baris menaut ke detail permintaannya, bukan ke antrean", () => {
  renderWidget([
    item({ code: "PST-2026-0001", publicId: "uuid-satu" }),
    item({ code: "PST-2026-0002", publicId: "../kunci/jahat" }),
  ]);

  const hrefs = screen
    .getAllByRole("link")
    .map((link) => link.getAttribute("href"));

  expect(hrefs.some((href) => href?.endsWith("/uuid-satu"))).toBe(true);
  expect(
    hrefs.some((href) =>
      href?.endsWith(`/${encodeURIComponent("../kunci/jahat")}`),
    ),
  ).toBe(true);
  expect(hrefs.some((href) => href?.includes("/../"))).toBe(false);
});
