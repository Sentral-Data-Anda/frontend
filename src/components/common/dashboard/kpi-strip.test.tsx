import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";
import { Users } from "lucide-react";

import { KpiCell } from "./kpi-strip";

afterEach(cleanup);

describe("KpiCell", () => {
  test("keterangan selalu tampil, juga saat galat", () => {
    render(<KpiCell label="Ibadah" icon={Users} hint="minggu ini" isError />);

    expect(screen.getByText("Gagal dimuat")).toBeTruthy();
    expect(screen.getByText("minggu ini")).toBeTruthy();
  });

  test("delta menggantikan keterangan, dengan panah bernama", () => {
    render(
      <KpiCell
        label="Masuk bulan ini"
        icon={Users}
        value="Rp 91 jt"
        hint="tanpa pembanding tahun lalu"
        delta={{ percent: 12, label: "vs Sep 2025", isUpGood: true }}
      />,
    );

    expect(screen.getByText("12% vs Sep 2025")).toBeTruthy();
    expect(screen.getByLabelText("naik")).toBeTruthy();
    expect(screen.queryByText("tanpa pembanding tahun lalu")).toBeNull();
  });
});
