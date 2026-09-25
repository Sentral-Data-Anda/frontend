import { describe, expect, test } from "bun:test";

import { FetchError } from "./api/fetcher";
import { applyServerError, firstErrorField } from "./form-error";

type Recorded = { field: string; message?: string };

const onCollect = () => {
  const calls: Recorded[] = [];

  return {
    calls,
    setError: ((field: string, error: { message?: string }) =>
      calls.push({ field, message: error.message })) as never,
  };
};

describe("applyServerError", () => {
  test("issues[] mendarat di fieldnya masing-masing (test wajib 6)", () => {
    const { calls, setError } = onCollect();

    applyServerError(
      new FetchError(400, "Data Tidak Valid", [
        { path: "name", message: "Nama minimal 3 karakter" },
        { path: "additional.0.date", message: "Tanggal wajib diisi" },
      ]),
      setError,
    );

    expect(calls).toEqual([
      { field: "name", message: "Nama minimal 3 karakter" },
      { field: "additional.0.date", message: "Tanggal wajib diisi" },
    ]);
  });

  test("pesan unik yang dikenal fitur dipetakan ke fieldnya", () => {
    const { calls, setError } = onCollect();

    applyServerError(
      new FetchError(400, "Email Sudah Tersedia"),
      setError,
      (message) =>
        /email sudah tersedia/i.test(message)
          ? { field: "email", message }
          : null,
    );

    expect(calls).toEqual([
      { field: "email", message: "Email Sudah Tersedia" },
    ]);
  });

  test("galat 500 jadi galat tingkat form, bukan galat field (test wajib 7)", () => {
    const { calls, setError } = onCollect();

    applyServerError(
      new FetchError(500, "Kesalahan server."),
      setError,
      () => null,
    );

    expect(calls).toEqual([{ field: "root", message: "Kesalahan server." }]);
  });

  test("galat jaringan jadi galat tingkat form dengan kalimat sendiri", () => {
    const { calls, setError } = onCollect();

    applyServerError(new TypeError("Failed to fetch"), setError);

    expect(calls[0].field).toBe("root");
    expect(calls[0].message).toContain("Periksa koneksi");
  });
});

describe("firstErrorField", () => {
  test("menyebut field pertama dari issues, dan null bila tidak ada", () => {
    expect(
      firstErrorField(
        new FetchError(400, "x", [{ path: "phone", message: "y" }]),
      ),
    ).toBe("phone");

    expect(firstErrorField(new FetchError(500, "x"))).toBeNull();
    expect(firstErrorField(new Error("x"))).toBeNull();
  });
});
