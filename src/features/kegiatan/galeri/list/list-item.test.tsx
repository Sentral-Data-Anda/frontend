import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { RowActionsProvider } from "@/components/common/list";

import { galeriDetailHref, galeriEditHref } from "../model";
import type { Album } from "../types";

import { GaleriListItemRow, galeriTable } from "./list-item";

afterEach(cleanup);

const ALBUM: Album = {
  publicId: "pid-albm-0006-0001",
  code: "ALBM_0006-0001",
  name: "Bazar Diakonia",
  isPublish: false,
  bapel: { id: 6, code: "BPL-6", name: "Komisi Diakonia" },
  listImage: [
    {
      publicId: "a",
      name: "Stan makanan",
      mimeType: "image/jpeg",
      size: 1,
      showOnWebsite: true,
      url: "http://media/a.jpg",
    },
  ],
};

describe("baris album", () => {
  test("judul menuju halaman album; meta jumlah foto + badan pelayanan; status titik", () => {
    render(
      <RowActionsProvider value={galeriTable(false).getRowActions?.(ALBUM)}>
        <ul>
          <GaleriListItemRow album={ALBUM} />
        </ul>
      </RowActionsProvider>,
    );

    expect(
      screen
        .getByRole("link", { name: "Lihat album Bazar Diakonia" })
        .getAttribute("href"),
    ).toBe(galeriDetailHref(ALBUM.code));
    expect(screen.getByText("1 foto · Komisi Diakonia")).toBeTruthy();
    expect(screen.getByText("Draf")).toBeTruthy();
    expect(
      screen.queryByRole("link", { name: "Ubah Bazar Diakonia" }),
    ).toBeNull();
  });

  test("pensil hanya dengan UPDATE", () => {
    render(
      <RowActionsProvider value={galeriTable(true).getRowActions?.(ALBUM)}>
        <ul>
          <GaleriListItemRow album={ALBUM} />
        </ul>
      </RowActionsProvider>,
    );

    expect(
      screen
        .getByRole("link", { name: "Ubah Bazar Diakonia" })
        .getAttribute("href"),
    ).toBe(galeriEditHref(ALBUM.publicId));
  });
});

describe("tabel album", () => {
  test("kolom aksi hanya dengan UPDATE; baris menuju halaman album", () => {
    expect(galeriTable(false).columns.map((column) => column.key)).toEqual([
      "album",
      "bapel",
      "photos",
      "website",
      "status",
    ]);
    expect(galeriTable(true).getRowActions?.(ALBUM)?.edit?.href).toContain(
      "/edit/",
    );
    expect(galeriTable(false).getRowActions?.(ALBUM)?.edit).toBeUndefined();
    expect(galeriTable(false).getRowActions?.(ALBUM)?.view?.href).toBe(
      galeriDetailHref(ALBUM.code),
    );
  });

  test("album draf: kolom Di website kosong, bukan hitungan", () => {
    const website = galeriTable(false).columns.find(
      (column) => column.key === "website",
    )!;
    render(<div>{website.cell(ALBUM)}</div>);

    expect(screen.getByText("Album draf belum tampil di website")).toBeTruthy();
    expect(screen.queryByText("1 dari 1")).toBeNull();
  });
});
