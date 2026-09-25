import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, jest, test } from "bun:test";

import { DataList, DataListRow } from "./data-list";
import { getPageItems, type DataListPagination } from "./data-list-pagination";

afterEach(cleanup);

describe("getPageItems", () => {
  test("tanpa elipsis sampai 7 halaman", () => {
    expect(getPageItems(1, 1)).toEqual([1]);
    expect(getPageItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  test("elipsis di kanan saat dekat awal", () => {
    expect(getPageItems(1, 12)).toEqual([1, 2, 3, 4, 5, "gap-end", 12]);
    expect(getPageItems(4, 12)).toEqual([1, 2, 3, 4, 5, "gap-end", 12]);
  });

  test("elipsis di kedua sisi di tengah", () => {
    expect(getPageItems(6, 12)).toEqual([
      1,
      "gap-start",
      5,
      6,
      7,
      "gap-end",
      12,
    ]);
  });

  test("elipsis di kiri saat dekat akhir", () => {
    expect(getPageItems(9, 12)).toEqual([1, "gap-start", 8, 9, 10, 11, 12]);
    expect(getPageItems(12, 12)).toEqual([1, "gap-start", 8, 9, 10, 11, 12]);
  });

  test("selalu 7 slot di atas 7 halaman, supaya pager tidak bergeser", () => {
    for (let page = 1; page <= 30; page += 1) {
      expect(getPageItems(page, 30)).toHaveLength(7);
      expect(getPageItems(page, 30)).toContain(page);
    }
  });
});

type Row = { code: string };

const rows: Row[] = [{ code: "A" }, { code: "B" }];

const more = (
  next: Partial<Extract<DataListPagination, { mode: "more" }>> = {},
): DataListPagination => ({
  mode: "more",
  isMoreAvailable: true,
  isLoadingMore: false,
  isLoadMoreError: false,
  isBusy: false,
  totalData: 5,
  onLoadMore: () => {},
  ...next,
});

const onRenderList = (pagination: DataListPagination) => {
  const ui = (next: DataListPagination) => (
    <DataList<Row>
      items={rows}
      getKey={(row) => row.code}
      label="Daftar uji"
      pagination={next}
    >
      {(row) => <DataListRow title={row.code} />}
    </DataList>
  );

  const view = render(ui(pagination));

  return {
    ...view,
    onUpdate: (next: DataListPagination) => view.rerender(ui(next)),
  };
};

describe("DataList — pager desktop", () => {
  test("halaman aktif ditandai aria-current", () => {
    onRenderList({
      mode: "pages",
      page: 2,
      totalPage: 12,
      onPickPage: () => {},
    });

    expect(
      screen
        .getByRole("button", { name: "Halaman 2" })
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(screen.queryByRole("button", { name: "Halaman 6" })).toBeNull();
  });
});

describe("DataList — muat lebih banyak (mobile/tablet)", () => {
  test("tombol muat lebih banyak ada selama data belum habis", () => {
    onRenderList(more());

    expect(
      screen.getByRole("button", { name: "Muat lebih banyak" }),
    ).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: "Paginasi" })).toBeNull();
  });

  test("skeleton ditambahkan di ujung, daftar lama tetap ada", () => {
    const { container } = onRenderList(more({ isLoadingMore: true }));

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(container.querySelectorAll("li[aria-hidden]")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Memuat…" })).toBeTruthy();
  });

  test("galat halaman berikutnya: daftar tetap, tombol coba lagi", () => {
    onRenderList(more({ isLoadMoreError: true }));

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Gagal memuat —")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeTruthy();
  });

  test("mengumumkan jumlah yang tampil, plus galat bila ada", () => {
    const { onUpdate } = onRenderList(more());

    expect(screen.getByText("2 dari 5 ditampilkan.")).toBeTruthy();

    onUpdate(more({ isLoadMoreError: true }));

    expect(
      screen.getByText("2 dari 5 ditampilkan. Gagal memuat data berikutnya."),
    ).toBeTruthy();
  });

  test("fokus pindah ke teks penutup saat tombol yang difokus hilang", () => {
    const { onUpdate } = onRenderList(more());

    screen.getByRole("button", { name: "Muat lebih banyak" }).focus();
    onUpdate(more({ isMoreAvailable: false }));

    expect(document.activeElement?.textContent).toBe(
      "Semua data sudah ditampilkan",
    );
  });

  test("sentinel terlihat selama refetch: halaman berikutnya diminta sesudahnya", () => {
    const original = globalThis.IntersectionObserver;
    globalThis.IntersectionObserver = class {
      constructor(private onReport: IntersectionObserverCallback) {}
      observe(target: Element) {
        this.onReport(
          [{ isIntersecting: true, target } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      }
      disconnect() {}
    } as unknown as typeof IntersectionObserver;

    try {
      const onLoadMore = jest.fn();
      const { onUpdate } = onRenderList(more({ isBusy: true, onLoadMore }));

      expect(onLoadMore).not.toHaveBeenCalled();

      onUpdate(more({ isBusy: false, onLoadMore }));

      expect(onLoadMore).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.IntersectionObserver = original;
    }
  });

  test("teks penutup juga saat semua muat di satu halaman", () => {
    onRenderList(more({ isMoreAvailable: false, totalData: 2 }));

    expect(screen.getByText("Semua data sudah ditampilkan")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Muat lebih banyak" }),
    ).toBeNull();
  });
});
