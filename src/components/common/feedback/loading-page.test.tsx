import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { LoadingPage } from "./loading-page";

describe("LoadingPage", () => {
  test("markupnya ada di HTML server, bukan menunggu klien", () => {
    const html = renderToStaticMarkup(<LoadingPage />);

    expect(html).toContain('role="status"');
    expect(html).toContain("Memuat");
  });

  test("nada brand: latar navy tanpa jeda muncul", () => {
    const html = renderToStaticMarkup(<LoadingPage tone="brand" />);

    expect(html).toContain("bg-primary");
    expect(html).not.toContain("bg-background");
  });
});
