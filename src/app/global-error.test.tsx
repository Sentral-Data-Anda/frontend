import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, jest } from "bun:test";

import GlobalError from "./global-error";

/**
 * Jaring terakhir ini hanya berguna kalau tiga hal benar sekaligus, dan
 * ketiganya mudah rusak tanpa ada yang menyadarinya:
 *
 * 1. Digest ditampilkan. Di production Next menyamarkan pesan error asli, jadi
 *    digest adalah SATU-SATUNYA hal yang bisa dibawa user ke pengurus untuk
 *    dicocokkan dengan baris log server.
 * 2. Error dilaporkan lewat `reportError`. Itu yang memicu event `error`
 *    global yang didengarkan src/instrumentation-client.ts.
 * 3. Tombol pemulihan memanggil `unstable_retry`, bukan sekadar menghias.
 *
 * Catatan: komponen ini merender `<html>` dan `<body>`-nya sendiri karena
 * MENGGANTIKAN root layout. Di dalam test ia tetap dirender ke dalam container
 * biasa, sehingga React memperingatkan "<html> cannot be a child of <div>".
 * Peringatan itu memang muncul dan bukan tanda ada yang rusak — yang diperiksa
 * di sini isinya, bukan posisinya di dokumen.
 */
describe("GlobalError", () => {
  /**
   * `reportError` dimatikan di SEMUA test, bukan hanya di test yang
   * memeriksanya. Di runtime test, primitif itu benar-benar melaporkan error
   * ke handler global dan bun menganggapnya kegagalan — jadi setiap render
   * komponen ini akan memerahkan test-nya sendiri tanpa ada yang salah.
   */
  let reported: jest.Mock<(error: unknown) => void>;

  beforeEach(() => {
    reported = jest.fn();
    jest.spyOn(globalThis, "reportError").mockImplementation(reported);
  });

  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
  });

  it("menampilkan digest supaya bisa dicocokkan dengan log server", () => {
    const error = Object.assign(new Error("disamarkan"), { digest: "1a2b3c" });

    render(<GlobalError error={error} unstable_retry={() => {}} />);

    expect(screen.getByText("1a2b3c")).toBeDefined();
  });

  it("tidak menampilkan baris kode error bila tidak ada digest", () => {
    render(
      <GlobalError
        error={new Error("tanpa digest")}
        unstable_retry={() => {}}
      />,
    );

    expect(screen.queryByText(/Kode error/)).toBeNull();
  });

  it("tidak pernah membocorkan pesan error ke halaman", () => {
    const error = Object.assign(new Error("nama jemaat: Budi Santoso"), {
      digest: "1a2b3c",
    });

    render(<GlobalError error={error} unstable_retry={() => {}} />);

    expect(document.body.textContent).not.toContain("Budi Santoso");
  });

  it("melaporkan error lewat reportError agar tertangkap instrumentation-client", () => {
    const error = new Error("gagal");

    render(<GlobalError error={error} unstable_retry={() => {}} />);

    expect(reported).toHaveBeenCalledWith(error);
  });

  it("tombol pemulihan memanggil unstable_retry", () => {
    const retry = jest.fn();

    render(<GlobalError error={new Error("gagal")} unstable_retry={retry} />);
    screen.getByRole("button", { name: "Coba lagi" }).click();

    expect(retry).toHaveBeenCalledTimes(1);
  });
});
