import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { Calendar } from "./calendar";

afterEach(cleanup);

const onRenderCalendar = (
  props: Partial<Parameters<typeof Calendar>[0]> = {},
) => {
  const picked: string[] = [];

  render(
    <Calendar
      value="2026-09-23"
      onPick={(iso) => picked.push(iso)}
      onClose={() => {}}
      min="1900-01-01"
      max="2026-09-30"
      {...props}
    />,
  );

  const cells = () => screen.queryAllByRole("gridcell");
  const cursor = () =>
    cells().find((cell) => cell.getAttribute("tabindex") === "0");

  return {
    picked,
    cells,
    cursor,
    grid: () => screen.queryByRole("grid"),
    press: (key: string, init: Partial<KeyboardEventInit> = {}) =>
      fireEvent.keyDown(screen.getByRole("grid"), { key, ...init }),
  };
};

describe("Calendar — kisi (§7.5)", () => {
  test("42 sel, pekan mulai Senin", () => {
    const cal = onRenderCalendar();

    expect(cal.cells()).toHaveLength(42);
    expect(screen.getByRole("columnheader", { name: "Sen" })).toBeTruthy();
  });

  test("hari ini ditandai aria-current, terpilih ditandai aria-selected", () => {
    const cal = onRenderCalendar({ value: "2026-09-10" });
    const selected = cal
      .cells()
      .filter((cell) => cell.getAttribute("aria-selected") === "true");

    expect(selected).toHaveLength(1);
    expect(selected[0].getAttribute("aria-label")).toBe("10 September 2026");
    expect(
      cal.cells().filter((c) => c.getAttribute("aria-current") === "date"),
    ).toHaveLength(1);
  });

  test("tiap sel punya aria-label lengkap, bukan cuma angka", () => {
    const cal = onRenderCalendar();

    expect(cal.cells()[0].getAttribute("aria-label")).toMatch(
      /^\d{1,2} \w+ \d{4}$/,
    );
  });

  /**
   * Satu titik Tab. Kisi 42 sel yang tiap selnya bisa di-Tab berarti 42 tekan
   * Tab untuk melewati kalender — persis yang dilarang APG.
   */
  test("hanya SATU sel yang bisa dijangkau Tab (roving tabindex)", () => {
    const cal = onRenderCalendar();

    expect(
      cal.cells().filter((c) => c.getAttribute("tabindex") === "0"),
    ).toHaveLength(1);
  });
});

describe("Calendar — batas min/max (§7.10 no. 7)", () => {
  test("hari di luar batas disabled dan tidak bisa dipilih", () => {
    const cal = onRenderCalendar({ max: "2026-09-23" });
    const future = cal
      .cells()
      .find((c) => c.getAttribute("aria-label") === "24 September 2026");

    expect((future as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(future as HTMLElement);
    expect(cal.picked).toHaveLength(0);
  });

  test("keyboard pun tidak bisa memilih hari di luar batas", () => {
    const cal = onRenderCalendar({ value: "2026-09-23", max: "2026-09-23" });

    cal.press("ArrowRight"); // ke 24 September, di luar batas
    cal.press("Enter");

    expect(cal.picked).toHaveLength(0);
  });

  test('"Hari ini" mati bila hari ini di luar batas', () => {
    onRenderCalendar({ max: "1990-01-01" });

    expect(
      (screen.getByRole("button", { name: "Hari ini" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});

describe("Calendar — keyboard (§7.8)", () => {
  test("panah menjelajah tanpa memilih apa pun", () => {
    const cal = onRenderCalendar({ value: "2026-09-10" });

    cal.press("ArrowRight");
    expect(cal.cursor()?.getAttribute("aria-label")).toBe("11 September 2026");
    expect(cal.picked).toHaveLength(0);

    cal.press("ArrowDown");
    expect(cal.cursor()?.getAttribute("aria-label")).toBe("18 September 2026");
  });

  test("Home dan End ke ujung pekan", () => {
    const cal = onRenderCalendar({ value: "2026-09-10" }); // Kamis

    cal.press("Home");
    expect(cal.cursor()?.getAttribute("aria-label")).toBe("7 September 2026");

    cal.press("End");
    expect(cal.cursor()?.getAttribute("aria-label")).toBe("13 September 2026");
  });

  test("PageUp/PageDown bulan, Shift+PageUp/PageDown tahun", () => {
    const cal = onRenderCalendar({ value: "2026-09-10", max: "2030-01-01" });

    cal.press("PageUp");
    expect(cal.cursor()?.getAttribute("aria-label")).toBe("10 Agustus 2026");

    cal.press("PageDown");
    expect(cal.cursor()?.getAttribute("aria-label")).toBe("10 September 2026");

    cal.press("PageUp", { shiftKey: true });
    expect(cal.cursor()?.getAttribute("aria-label")).toBe("10 September 2025");
  });

  test("Enter memilih hari yang sedang dituju", () => {
    const cal = onRenderCalendar({ value: "2026-09-10" });

    cal.press("ArrowRight");
    cal.press("Enter");

    expect(cal.picked).toEqual(["2026-09-11"]);
  });
});

describe("Calendar — kisi tahun dan varian (§7.10 no. 6)", () => {
  test("varian lahir membuka kisi tahun, bukan bulan berjalan", () => {
    const cal = onRenderCalendar({ startInYearGrid: true, value: "" });

    expect(cal.grid()).toBeNull();
    expect(screen.getByText("Pilih tahun")).toBeTruthy();
  });

  test("varian dekat membuka bulan berjalan", () => {
    const cal = onRenderCalendar({ startInYearGrid: false });

    expect(cal.grid()).not.toBeNull();
    expect(screen.queryByText("Pilih tahun")).toBeNull();
  });

  test("judul bulan adalah tombol yang membuka kisi tahun", () => {
    const cal = onRenderCalendar();

    fireEvent.click(screen.getByRole("button", { name: /September 2026/ }));

    expect(screen.getByText("Pilih tahun")).toBeTruthy();
    expect(cal.grid()).toBeNull();
  });

  test("memilih tahun kembali ke kisi hari di tahun itu", () => {
    const cal = onRenderCalendar({
      startInYearGrid: true,
      value: "2026-09-23",
    });

    fireEvent.click(screen.getByRole("button", { name: "1990" }));

    expect(cal.grid()).not.toBeNull();
    expect(screen.getByRole("button", { name: /September 1990/ })).toBeTruthy();
  });

  test("kisi tahun dibatasi min dan max", () => {
    onRenderCalendar({ startInYearGrid: true, min: "2020-01-01" });

    expect(screen.getByRole("button", { name: "2020" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "2019" })).toBeNull();
  });
});

describe("Calendar — kaki (§7.10 no. 9)", () => {
  test('"Hapus" mengirim string kosong, bukan null', () => {
    const cal = onRenderCalendar({ isClearable: true });

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));

    expect(cal.picked).toEqual([""]);
  });

  test('"Hapus" tidak ada untuk field yang wajib', () => {
    onRenderCalendar({ isClearable: false });

    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });

  test('"Pilih" hanya di panel HP', () => {
    onRenderCalendar({ hasConfirm: false });
    expect(screen.queryByRole("button", { name: "Pilih" })).toBeNull();

    cleanup();

    onRenderCalendar({ hasConfirm: true });
    expect(screen.getByRole("button", { name: "Pilih" })).toBeTruthy();
  });
});
