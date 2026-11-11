import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { AppLink } from "./app-link";

afterEach(cleanup);

describe("AppLink", () => {
  test("di luar router merender tautan biasa dengan href utuh", () => {
    render(
      <AppLink href="/jemaat?page=2" className="tautan">
        Jemaat
      </AppLink>,
    );

    const link = screen.getByRole("link", { name: "Jemaat" });

    expect(link.getAttribute("href")).toBe("/jemaat?page=2");
    expect(link.className).toBe("tautan");
  });

  test("tautan luar tetap tautan biasa", () => {
    render(<AppLink href="https://example.org">Luar</AppLink>);

    expect(
      screen.getByRole("link", { name: "Luar" }).getAttribute("href"),
    ).toBe("https://example.org");
  });
});
