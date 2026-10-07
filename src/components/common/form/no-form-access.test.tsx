import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { NoFormAccess } from "./no-form-access";

afterEach(cleanup);

describe("NoFormAccess", () => {
  test("judul, alasan, saran admin, dan tautan kembali", () => {
    render(
      <NoFormAccess
        title="Tidak bisa menambah ibadah"
        description="Peran Anda hanya bisa melihat data ibadah."
        backHref="/peribadahan/ibadah"
        backLabel="Kembali ke Ibadah"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Tidak bisa menambah ibadah" }),
    ).toBeTruthy();
    expect(
      screen.getByText("Peran Anda hanya bisa melihat data ibadah."),
    ).toBeTruthy();
    expect(screen.getByText(/Hubungi administrator/)).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Kembali ke Ibadah" })
        .getAttribute("href"),
    ).toBe("/peribadahan/ibadah");
  });

  const props = {
    title: "Tidak bisa mengubah x",
    description: "Peran Anda hanya bisa melihat x.",
    backHref: "/x",
    backLabel: "Kembali ke X",
  };

  test("tanpa VIEW: tidak mengaku bisa melihat, saran admin tetap ada", () => {
    render(<NoFormAccess {...props} isCanView={false} />);

    expect(screen.queryByText(/hanya bisa melihat/)).toBeNull();
    expect(
      screen.getByText("Peran Anda tidak memiliki akses ke menu ini."),
    ).toBeTruthy();
    expect(screen.getByText(/Hubungi administrator/)).toBeTruthy();
  });

  test("terkunci keadaan dokumen: tanpa saran hubungi administrator", () => {
    render(<NoFormAccess {...props} isStateLocked />);

    expect(screen.getByText(props.description)).toBeTruthy();
    expect(screen.queryByText(/Hubungi administrator/)).toBeNull();
    expect(screen.queryByText(/administrator/i)).toBeNull();
  });
});
