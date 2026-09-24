import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { LoadingPage } from "./loading-page";

/**
 * Yang diuji di sini bukan animasinya, melainkan satu kegagalan yang pernah
 * terjadi dan tidak terlihat di test klien: `loading.tsx` dirender di SERVER.
 * Saat jendela tampil 150ms dipegang state React, HTML fallback-nya kosong dan
 * refresh penuh dengan server lambat menampilkan layar putih berdetik-detik —
 * timernya baru jalan setelah hidrasi, padahal hidrasi tertahan selama
 * boundary-nya menunggu.
 */
describe("LoadingPage", () => {
  test("markupnya ada di HTML server, bukan menunggu klien", () => {
    const html = renderToStaticMarkup(<LoadingPage />);

    expect(html).toContain('role="status"');
    expect(html).toContain("Memuat");
  });
});
