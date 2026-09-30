import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import type { CalendarHoliday } from "@/hooks/use-holiday-calendar";
import { todayJakarta } from "@/lib/date";

import { Calendar } from "./calendar";

const originalFetch = globalThis.fetch;
const requested: string[] = [];

const onStubHolidays = (answer: CalendarHoliday[] | number) => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    requested.push(String(input));

    return typeof answer === "number"
      ? Response.json({ status: answer, error: "Gagal" }, { status: answer })
      : Response.json({ status: 200, message: "OK", data: answer });
  }) as typeof fetch;
};

beforeEach(() => onStubHolidays([]));

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  requested.length = 0;
});

const onRenderCalendar = (
  props: Partial<Parameters<typeof Calendar>[0]> = {},
) => {
  const picked: string[] = [];

  render(
    <QueryClientProvider client={new QueryClient()}>
      <Calendar
        value="2026-09-23"
        onPick={(iso) => picked.push(iso)}
        onClose={() => {}}
        min="1900-01-01"
        max="2026-09-30"
        {...props}
      />
    </QueryClientProvider>,
  );

  const cells = () => screen.queryAllByRole("gridcell");
  const cursor = () =>
    cells().find((cell) => cell.getAttribute("tabindex") === "0");

  return {
    picked,
    cells,
    cursor,
    grid: () => document.querySelector('[role="grid"][aria-label="Kalender"]'),
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

  test("terpilih ditandai aria-selected, hanya satu sel", () => {
    const cal = onRenderCalendar({ value: "2026-09-10" });
    const selected = cal
      .cells()
      .filter((cell) => cell.getAttribute("aria-selected") === "true");

    expect(selected).toHaveLength(1);
    expect(selected[0].getAttribute("aria-label")).toBe("10 September 2026");
  });

  test("hari di luar bulan ditandai data-outside dan tetap bisa dipilih", () => {
    const cal = onRenderCalendar({ value: "2024-09-10" });
    const outside = cal.cells().filter((c) => c.hasAttribute("data-outside"));

    expect(outside.map((c) => Number(c.textContent))).toEqual([
      26, 27, 28, 29, 30, 31, 1, 2, 3, 4, 5, 6,
    ]);
    expect(outside.every((c) => !(c as HTMLButtonElement).disabled)).toBe(true);
    fireEvent.click(outside[0]);
    expect(cal.picked).toEqual(["2024-08-26"]);
  });

  test("hari ini: aria-current + data-today, juga saat terpilih", () => {
    const today = todayJakarta();
    const cal = onRenderCalendar({ value: today, max: undefined });
    const marked = cal.cells().filter((c) => c.hasAttribute("data-today"));

    expect(marked).toHaveLength(1);
    expect(marked[0].getAttribute("aria-current")).toBe("date");
    expect(
      cal.cells().filter((c) => c.getAttribute("aria-current") === "date"),
    ).toHaveLength(1);
    expect(marked[0].getAttribute("aria-selected")).toBe("true");
  });

  test("tiap sel punya aria-label lengkap, bukan cuma angka", () => {
    const cal = onRenderCalendar();

    expect(cal.cells()[0].getAttribute("aria-label")).toMatch(
      /^\d{1,2} \w+ \d{4}$/,
    );
  });

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

  test("disabled di bulan berjalan dicoret, tidak dipudarkan seperti luar bulan", () => {
    const cal = onRenderCalendar({ max: "2026-09-27" });
    const byLabel = (label: string) =>
      cal.cells().find((c) => c.getAttribute("aria-label") === label)!;
    const disabled = byLabel("28 September 2026");
    const outside = cal
      .cells()
      .find(
        (c) => c.hasAttribute("data-outside") && !c.hasAttribute("data-today"),
      )!;

    expect(disabled.hasAttribute("data-outside")).toBe(false);
    expect(disabled.className).toContain("line-through");
    expect(disabled.className).not.toContain("text-muted-foreground/70");
    expect(disabled.className).not.toContain("hover:bg-accent");
    expect(outside.hasAttribute("data-outside")).toBe(true);
    expect(outside.className).toContain("text-muted-foreground/70");
  });

  test("panah berhenti di batas, tidak melompat ke hari terlarang", () => {
    const cal = onRenderCalendar({ value: "2026-09-23", max: "2026-09-23" });

    cal.press("ArrowRight");

    expect(cal.cursor()?.getAttribute("aria-label")).toBe("23 September 2026");
  });

  test("tekanan sesudah ditolak batas tidak tertelan", () => {
    const cal = onRenderCalendar({ value: "2026-09-23", max: "2026-09-23" });

    cal.press("ArrowRight");
    cal.press("ArrowLeft");

    expect(cal.cursor()?.getAttribute("aria-label")).toBe("22 September 2026");
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
    const cal = onRenderCalendar({ value: "2026-09-10" });

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

    fireEvent.click(screen.getByText("1990"));

    expect(cal.grid()).not.toBeNull();
    expect(screen.getByRole("button", { name: /September 1990/ })).toBeTruthy();
  });

  test("kisi tahun dibatasi min dan max", () => {
    onRenderCalendar({ startInYearGrid: true, min: "2020-01-01" });

    expect(screen.getByText("2020")).toBeTruthy();
    expect(screen.queryByText("2019")).toBeNull();
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
    onRenderCalendar({ isConfirmVisible: false });
    expect(screen.queryByRole("button", { name: "Pilih" })).toBeNull();

    cleanup();

    onRenderCalendar({ isConfirmVisible: true });
    expect(screen.getByRole("button", { name: "Pilih" })).toBeTruthy();
  });
});

describe("Calendar — panah di kisi tahun", () => {
  const onRenderYears = () => {
    const view = onRenderCalendar({
      startInYearGrid: true,
      value: "2026-09-10",
      max: "2026-09-30",
    });
    const yearGrid = () =>
      document.querySelector(
        '[role="grid"][aria-label="Pilih tahun"]',
      ) as HTMLElement;
    const current = () =>
      yearGrid().querySelector('[tabindex="0"]')?.textContent;
    const press = (key: string) => fireEvent.keyDown(yearGrid(), { key });

    return { ...view, current, press };
  };

  test("hanya SATU tahun yang bisa dijangkau Tab", () => {
    onRenderYears();

    expect(
      document.querySelectorAll(
        '[role="grid"][aria-label="Pilih tahun"] [tabindex="0"]',
      ),
    ).toHaveLength(1);
  });

  test("kanan/kiri satu tahun, bawah/atas satu baris (4 tahun)", () => {
    const years = onRenderYears();

    expect(years.current()).toBe("2026");
    years.press("ArrowRight");
    expect(years.current()).toBe("2025");
    years.press("ArrowDown");
    expect(years.current()).toBe("2021");
    years.press("ArrowUp");
    expect(years.current()).toBe("2025");
    years.press("ArrowLeft");
    expect(years.current()).toBe("2026");
  });

  test("tidak melewati tahun terbaru maupun tertua", () => {
    const years = onRenderYears();

    years.press("ArrowLeft");
    years.press("ArrowUp");
    expect(years.current()).toBe("2026");
  });

  test("PageDown melompat tiga baris", () => {
    const years = onRenderYears();

    years.press("PageDown");
    expect(years.current()).toBe("2014");
  });

  test("Home/End ke ujung baris", () => {
    const years = onRenderYears();

    years.press("ArrowRight");
    years.press("End");
    expect(years.current()).toBe("2023");
    years.press("Home");
    expect(years.current()).toBe("2026");
  });

  test("memilih tahun lewat klik kembali ke kisi hari di tahun itu", () => {
    const years = onRenderYears();

    years.press("PageDown");
    fireEvent.click(screen.getByText("2014"));

    expect(
      document.querySelector('[role="grid"][aria-label="Kalender"]'),
    ).not.toBeNull();
    expect(screen.getByRole("button", { name: /September 2014/ })).toBeTruthy();
  });
});

describe("Calendar — penanda hari libur", () => {
  const HOLIDAYS: CalendarHoliday[] = [
    { date: "2026-08-31", name: "Libur Akhir Agustus", type: "GEREJA" },
    { date: "2026-09-17", name: "Retret Majelis", type: "GEREJA" },
    { date: "2026-09-23", name: "HUT Gereja", type: "GEREJA" },
    { date: "2026-09-23", name: "Syukur Panen", type: "GEREJA" },
    { date: "2026-09-23", name: "HUT Gereja", type: "GEREJA" },
    { date: "2026-09-25", name: "Libur Nasional", type: "NASIONAL" },
  ];

  const byDate = (cal: ReturnType<typeof onRenderCalendar>, text: string) =>
    cal
      .cells()
      .find((cell) => cell.getAttribute("aria-label")?.startsWith(text));

  test("rentang = sel pertama sampai terakhir di kisi bulan", async () => {
    onRenderCalendar({ value: "2026-09-10" });

    await waitFor(() => expect(requested).toHaveLength(1));
    expect(requested[0]).toBe(
      "/api/v1/hari-libur/kalender?from=2026-08-31&to=2026-10-11",
    );
  });

  test("tanggal libur diberi penanda, title, dan nama aksesibel", async () => {
    onStubHolidays(HOLIDAYS);
    const cal = onRenderCalendar({ value: "2026-09-10" });

    await waitFor(() =>
      expect(
        cal.cells().filter((cell) => cell.hasAttribute("data-holiday")),
      ).toHaveLength(4),
    );

    const retreat = byDate(cal, "17 September 2026")!;
    expect(retreat.getAttribute("aria-label")).toBe(
      "17 September 2026, libur: Retret Majelis",
    );
    expect(retreat.getAttribute("title")).toBe("Retret Majelis");
    expect(byDate(cal, "31 Agustus 2026")?.hasAttribute("data-outside")).toBe(
      true,
    );
    expect(byDate(cal, "18 September 2026")?.hasAttribute("data-holiday")).toBe(
      false,
    );
  });

  test("beberapa libur di satu hari digabung dengan titik koma, nama kembar sekali", async () => {
    onStubHolidays(HOLIDAYS);
    const cal = onRenderCalendar({ value: "2026-09-10" });

    await waitFor(() =>
      expect(byDate(cal, "23 September 2026")?.getAttribute("title")).toBe(
        "HUT Gereja; Syukur Panen",
      ),
    );
    expect(byDate(cal, "23 September 2026")?.getAttribute("aria-label")).toBe(
      "23 September 2026, libur: HUT Gereja; Syukur Panen",
    );
  });

  test("tanggal libur tetap bisa dipilih; batas max tetap berlaku", async () => {
    onStubHolidays(HOLIDAYS);
    const cal = onRenderCalendar({ value: "2026-09-10", max: "2026-09-24" });

    await waitFor(() =>
      expect(byDate(cal, "17 September 2026")?.title).toBe("Retret Majelis"),
    );
    fireEvent.click(byDate(cal, "17 September 2026")!);
    expect(cal.picked).toEqual(["2026-09-17"]);

    const beyond = byDate(cal, "25 September 2026") as HTMLButtonElement;
    expect(beyond.hasAttribute("data-holiday")).toBe(true);
    expect(beyond.disabled).toBe(true);
  });

  test("galat fetch: kalender utuh tanpa penanda", async () => {
    onStubHolidays(500);
    const cal = onRenderCalendar({ value: "2026-09-10" });

    await waitFor(() => expect(requested).toHaveLength(1));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(cal.cells()).toHaveLength(42);
    expect(document.querySelector("[data-holiday]")).toBeNull();
    fireEvent.click(byDate(cal, "17 September 2026")!);
    expect(cal.picked).toEqual(["2026-09-17"]);
  });

  test("kisi tahun tidak diberi penanda", async () => {
    onStubHolidays(HOLIDAYS);
    onRenderCalendar({ startInYearGrid: true, value: "2026-09-10" });

    await waitFor(() => expect(requested).toHaveLength(1));

    expect(document.querySelector("[data-holiday]")).toBeNull();
  });
});
