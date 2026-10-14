import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { DashboardGrid } from "./dashboard-grid";

afterEach(cleanup);

const renderGrid = () =>
  render(
    <DashboardGrid
      isFullHeight
      main={[<div key="m">utama</div>]}
      side={[<div key="s">sisi</div>]}
    />,
  );

/**
 * `sr-only` memakai `position: absolute`, dan elemen absolut mencari leluhur
 * TERPOSISI sebagai blok penampungnya. Tanpa `relative` di kotak gulirnya,
 * penampungnya adalah `html` sendiri: label pembaca layar di dalam kartu lolos
 * dari kotak gulir, ikut menentukan tinggi dokumen, dan halamannya menggulir
 * beserta sidebar-nya sampai label terakhir.
 *
 * Gejalanya tidak terlihat di kode mana pun dan `overflow: hidden` di leluhur
 * mana pun tidak menahannya, jadi kelasnya dipaku di sini.
 */
test("kotak gulirnya terposisi, supaya isi absolut tidak lolos ke dokumen", () => {
  const { container } = renderGrid();

  const scrollers = [...container.querySelectorAll("div")].filter((el) =>
    el.className.includes("overflow-y-auto"),
  );

  expect(scrollers.length).toBeGreaterThan(0);
  for (const el of scrollers) {
    expect(el.className.split(" ")).toContain("relative");
  }
});

/**
 * Tinggi dashboard dikunci sejak `lg:` (viewport 1024px) sementara kolomnya
 * baru terbelah pada container 60rem. Di antara keduanya isi kartu meluber dan
 * yang menggulir justru seluruh dokumen, jadi selisih itu harus punya kotak
 * gulirnya sendiri.
 */
test("isi dashboard punya kotak gulir sendiri di bawah ambang terbelah", () => {
  const { container } = renderGrid();

  const stacked = [...container.querySelectorAll("div")].some((el) =>
    el.className.includes("@max-[59.9375rem]:overflow-y-auto"),
  );

  expect(stacked).toBe(true);
});
