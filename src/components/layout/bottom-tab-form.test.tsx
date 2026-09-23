import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import { SessionProvider } from "@/features/auth/session-provider";
import type { Session } from "@/features/auth/types";

const pathname = { current: "/kejemaatan/daftar-jemaat" };

mock.module("next/navigation", () => ({
  usePathname: () => pathname.current,
}));

const { BottomTab } = await import("./bottom-tab");

afterEach(cleanup);

/** Sesi paling tipis: bottom tab hanya membaca `menu`. */
const SESSION = { menu: [] } as unknown as Session;

const onRenderTab = (path: string) => {
  pathname.current = path;

  return render(
    <SessionProvider session={SESSION}>
      <BottomTab />
    </SessionProvider>,
  );
};

/**
 * Keputusan user 2026-09-23: layar isian tidak punya bottom tab. Di 390 bilah
 * aksi lengket + bottom tab memakan 117px, dan bottom tab adalah jalan keluar
 * satu ketukan dari form setengah terisi tanpa melewati konfirmasi.
 *
 * Diuji lewat RUTE, bukan lewat prop: begitulah 60 form berikutnya ikut
 * aturan ini tanpa mendaftarkan apa pun.
 */
describe("bottom tab di layar isian", () => {
  test("layar daftar tetap punya navigasi", () => {
    onRenderTab("/kejemaatan/daftar-jemaat");

    expect(
      screen.getByRole("navigation", { name: "Navigasi utama" }),
    ).toBeTruthy();
  });

  test("rute tambah tidak merender navigasi sama sekali", () => {
    const { container } = onRenderTab("/kejemaatan/daftar-jemaat/baru");

    // Bukan disembunyikan: `nav` sticky MEMAKAI ruangnya sendiri di aliran
    // dokumen, jadi yang harus hilang adalah elemennya — bukan tampilannya,
    // dan bukan diganti padding di layar (yang menghitung ruang dua kali).
    expect(container.innerHTML).toBe("");
  });

  test("rute ubah tidak merender navigasi sama sekali", () => {
    const { container } = onRenderTab(
      "/kejemaatan/daftar-jemaat/JMT-0042/ubah",
    );

    expect(container.innerHTML).toBe("");
  });
});
