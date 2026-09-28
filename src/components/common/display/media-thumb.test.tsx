import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { MediaThumb } from "./media-thumb";

afterEach(cleanup);

describe("MediaThumb", () => {
  test("merender gambar lazy dengan alt", () => {
    render(<MediaThumb src="http://media/a.jpg" alt="Retret Pemuda" />);

    const image = screen.getByRole("img", { name: "Retret Pemuda" });

    expect(image.getAttribute("loading")).toBe("lazy");
  });

  test("gagal muat menampilkan keadaan gagal, bukan gambar rusak", () => {
    render(<MediaThumb src="http://media/expired.jpg" alt="Poster" />);

    fireEvent.error(screen.getByRole("img", { name: "Poster" }));

    expect(screen.queryByRole("img", { name: "Poster" })).toBeNull();
    expect(screen.getByText("Gambar Poster tidak dapat dimuat")).toBeDefined();
  });

  test("tanpa src menampilkan penanda kosong", () => {
    render(<MediaThumb src={null} alt="Bazar" />);

    expect(screen.getByText("Bazar tanpa gambar")).toBeDefined();
  });
});
