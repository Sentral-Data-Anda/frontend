import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { FormAlert } from "./form-alert";

afterEach(cleanup);

describe("FormAlert", () => {
  test("bawaan galat: role alert, nada destructive", () => {
    render(<FormAlert title="Data belum tersimpan." message="Gagal." />);

    const alert = screen.getByRole("alert");
    expect(alert.className).toContain("border-destructive");
    expect(screen.getByText("Gagal.").className).toContain("text-destructive");
  });

  test("tone info: role status, tanpa warna galat", () => {
    render(<FormAlert tone="info" title="Catatan" message="Hanya baca." />);

    const status = screen.getByRole("status");
    expect(status.className).toContain("bg-card");
    expect(status.className).not.toContain("destructive");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("Hanya baca.").className).toContain(
      "text-foreground",
    );
  });

  test("tone warning: role status, bingkai warning", () => {
    render(
      <FormAlert
        tone="warning"
        title="Melebihi perkiraan"
        message="Tetap bisa disimpan."
      />,
    );

    const status = screen.getByRole("status");
    expect(status.className).toContain("border-warning");
    expect(status.className).not.toContain("destructive");
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

// Teks pengguna tanpa spasi — alasan pembebasan, nama penerima, keterangan —
// meluber KELUAR dari kotak spanduk tanpa melebarkan kotaknya: `min-w-0`
// menahan lebar flex item-nya, jadi `getBoundingClientRect` melaporkan lebar
// yang benar sementara halamannya menggulir mendatar (terukur di peramban:
// client 300, scroll 1953 di lebar 390).
//
// LANGIT-LANGIT penjaga ini: happy-dom tidak melakukan layout, jadi ia tidak
// bisa mengukur `scrollWidth` lawan `clientWidth` — satu-satunya yang benar-
// benar membuktikannya. Yang dijaga di sini adalah KELASNYA ada, dan itu
// menangkap kecelakaan (seseorang menulis ulang pembungkusnya), bukan penulis
// yang bertekad. Pengukuran sebenarnya milik verifikasi peramban; lihat
// pedoman §7.3.
describe("FormAlert: teks pengguna yang tak terbatas", () => {
  // Keluarga ejaannya, bukan satu literal: `break-words` adalah nama Tailwind
  // v3 dan di v4 ia TIDAK menghasilkan aturan apa pun (diperiksa di CSS hasil
  // build: hanya `.wrap-break-word{overflow-wrap:break-word}` yang terbit).
  // Keduanya tetap diterima di sini supaya penjaga ini tidak jatuh kalau
  // repo-nya kembali ke v3 — tapi hanya satu yang benar hari ini.
  const WRAPPING = ["wrap-break-word", "break-words", "wrap-anywhere"];

  const isWrapping = (node: HTMLElement) => {
    for (let el: HTMLElement | null = node; el; el = el.parentElement) {
      if (WRAPPING.some((name) => el!.classList.contains(name))) return true;
    }

    return false;
  };

  test("judul dan pesan sama-sama mewarisi aturan pembungkusnya", () => {
    const long = "A".repeat(250);

    render(<FormAlert tone="info" title={long} message={long} />);

    const texts = screen.getAllByText(long);

    expect(texts.length).toBe(2);
    expect(texts.every((node) => isWrapping(node))).toBe(true);
  });
});
