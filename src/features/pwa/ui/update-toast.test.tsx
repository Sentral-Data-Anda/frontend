import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, jest } from "bun:test";

import { UpdateToast } from "@/features/pwa/ui/update-toast";

/**
 * Test komponen pertama di repo ini. Yang dijaga bukan susunan markup-nya,
 * tapi dua hal yang punya konsekuensi nyata:
 *
 * 1. `role="status"` + `aria-live="polite"`. Tanpa itu pemberitahuan ini tidak
 *    pernah diumumkan screen reader, dan user yang memakainya tertinggal pada
 *    versi lama tanpa tahu ada versi baru.
 * 2. Tombolnya benar-benar memanggil `onApply`. Itu satu-satunya jalan keluar
 *    dari komponen ini — tidak ada tombol tutup — jadi tombol yang mati
 *    berarti user terkunci di versi lama selamanya.
 *
 * `cleanup()` dipanggil manual: auto-cleanup Testing Library bergantung pada
 * hook global milik Jest/Vitest yang tidak terpasang di bun test.
 */
describe("UpdateToast", () => {
  afterEach(cleanup);

  it("diumumkan ke teknologi bantu sebagai status yang sopan", () => {
    render(<UpdateToast onApply={() => {}} />);

    const status = screen.getByRole("status");
    expect(status).toBeDefined();
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.textContent).toContain("Versi baru tersedia");
  });

  it("meneruskan klik ke onApply", () => {
    const onApply = jest.fn();
    render(<UpdateToast onApply={onApply} />);

    screen.getByRole("button", { name: "Muat ulang" }).click();

    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it("tidak menyediakan cara menutup tanpa memuat ulang", () => {
    render(<UpdateToast onApply={() => {}} />);

    expect(screen.getAllByRole("button")).toHaveLength(1);
  });
});
