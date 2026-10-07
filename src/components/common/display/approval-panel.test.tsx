import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({
    isCanView: true,
    isCanCreate: false,
    isCanUpdate: false,
    isCanDelete: false,
  }),
}));

const { ApprovalPanel } = await import("./approval-panel");

afterEach(cleanup);

const STEPS = [
  {
    order: 1,
    approverRoleName: "Ketua",
    status: "REJECTED" as const,
    actor: { name: "Pak Ketua" },
    actedAt: null,
    note: "Catatan penolakan",
  },
  {
    order: 2,
    approverRoleName: null,
    status: "PENDING" as const,
    actor: null,
    actedAt: null,
    note: null,
  },
];

const approval = {
  publicId: "apr-1",
  code: "APR-1",
  status: "PENDING" as const,
  steps: STEPS,
};

describe("ApprovalPanel", () => {
  test("tanpa renderStep: baris bawaan, data tambahan pada langkah tidak bocor", () => {
    render(<ApprovalPanel approval={approval} />);

    expect(screen.queryByText(/Catatan penolakan/)).toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Jabatan tidak tercatat")).toBeTruthy();
  });

  test("renderStep: satu baris per langkah, menggantikan baris bawaan", () => {
    render(
      <ApprovalPanel
        approval={approval}
        renderStep={(step) => <li data-testid="row">{step.note ?? "-"}</li>}
      />,
    );

    expect(screen.getAllByTestId("row").map((n) => n.textContent)).toEqual([
      "Catatan penolakan",
      "-",
    ]);
    expect(screen.queryByText("Ketua")).toBeNull();
  });

  test("alert dan children ada di dalam panel Persetujuan, tautan kode tetap", () => {
    render(
      <ApprovalPanel
        approval={{ ...approval, steps: undefined }}
        alert={<p>isi alert</p>}
      >
        <p>isi anak</p>
      </ApprovalPanel>,
    );

    const panel = screen.getByRole("region", { name: "Persetujuan" });

    expect(within(panel).getByText("isi alert")).toBeTruthy();
    expect(within(panel).getByText("isi anak")).toBeTruthy();
    expect(within(panel).getByRole("link", { name: "APR-1" })).toBeTruthy();
  });
});
