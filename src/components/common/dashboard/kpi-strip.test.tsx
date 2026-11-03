import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";
import { Users } from "lucide-react";

import { KpiCell, KpiStrip } from "./kpi-strip";

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

describe("KpiStrip", () => {
  const stripOf = (count: number) =>
    render(
      <KpiStrip label="Ringkasan">
        {Array.from({ length: count }, (_, index) => (
          <span key={index}>sel {index}</span>
        ))}
      </KpiStrip>,
    ).container.querySelector("section")!.className;

  /**
   * Role dengan satu akses menu cuma punya satu KPI. Tanpa batas lebarnya
   * kartu itu melar selebar strip dan angkanya menempel di kiri kartu --
   * keluhan §10.12 yang sama, cuma muncul lagi lewat jumlah sel.
   */
  test("satu sel dibatasi 28rem sejak strip jadi satu kolom", () => {
    expect(stripOf(1)).toContain(
      "@min-[36rem]/strip:grid-cols-[minmax(0,28rem)]",
    );
  });

  test("dua sel tetap 1fr sampai 55rem, supaya tidak jadi dua kartu selebar layar", () => {
    const className = stripOf(2);

    expect(className).toContain(
      "@min-[36rem]/strip:grid-cols-[repeat(var(--kpi-cols),minmax(0,1fr))]",
    );
    expect(className).toContain(
      "@min-[55rem]/strip:grid-cols-[repeat(var(--kpi-cols),minmax(0,28rem))]",
    );
  });

  test("mulai tiga sel strip mengisi lebar penuh", () => {
    expect(stripOf(3)).toContain(
      "@min-[55rem]/strip:grid-cols-[repeat(var(--kpi-cols),minmax(0,1fr))]",
    );
  });
});
