import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

let query = new URLSearchParams();

mock.module("next/navigation", () => ({
  usePathname: () => "/login",
  useRouter: () => ({ replace: () => {} }),
  useSearchParams: () => query,
}));

const { LoginForm } = await import("./login-form");

afterEach(cleanup);

describe("LoginForm", () => {
  test("sesi berakhir: spanduk penjelasan tampil", () => {
    query = new URLSearchParams("reason=session-ended");

    render(<LoginForm />);

    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText("Sesi Anda telah berakhir")).toBeTruthy();
  });

  test("tanpa alasan: tidak ada spanduk", () => {
    query = new URLSearchParams();

    render(<LoginForm />);

    expect(screen.queryByRole("status")).toBeNull();
  });
});
