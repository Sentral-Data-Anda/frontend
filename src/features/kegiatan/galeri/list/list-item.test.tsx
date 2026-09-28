import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { galeriDetailHref, galeriEditHref } from "../model";
import type { Album } from "../types";

import { GaleriListItemRow, galeriTable } from "./list-item";

afterEach(cleanup);

const ALBUM: Album = {
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
      <ul>
        <GaleriListItemRow album={ALBUM} />
      </ul>,
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
      <ul>
        <GaleriListItemRow album={ALBUM} isCanUpdate />
      </ul>,
    );

    expect(
      screen
        .getByRole("link", { name: "Ubah Bazar Diakonia" })
        .getAttribute("href"),
    ).toBe(galeriEditHref(ALBUM.code));
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
    expect(galeriTable(true).columns.at(-1)?.key).toBe("edit");
    expect(galeriTable(false).getRowHref?.(ALBUM)).toBe(
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
