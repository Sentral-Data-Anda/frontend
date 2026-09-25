import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, jest } from "bun:test";

import { UpdateToast } from "./update-toast";

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
