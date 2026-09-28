import { afterEach, describe, expect, test } from "bun:test";

import { FetchError } from "./api/fetcher";
import { applyServerError, FIRST_INVALID, revealField } from "./form-error";

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

    const field = applyServerError(
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
    expect(field).toBe("name");
  });

  test("pesan unik yang dikenal fitur dipetakan ke fieldnya", () => {
    const { calls, setError } = onCollect();

    const field = applyServerError(
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
    expect(field).toBe("email");
  });

  test("issues[] yang pesannya dikenal fitur memakai kalimat fitur, path tetap dari server", () => {
    const { calls, setError } = onCollect();

    const field = applyServerError(
      new FetchError(409, "Role Pelayan Sudah Tersedia", [
        { path: "name", message: "Role Pelayan Sudah Tersedia" },
        { path: "other", message: "Tidak dikenal" },
      ]),
      setError,
      (message) =>
        /role pelayan sudah tersedia/i.test(message)
          ? { field: "root", message: "Tugas dengan nama ini sudah ada." }
          : null,
    );

    expect(calls).toEqual([
      { field: "name", message: "Tugas dengan nama ini sudah ada." },
      { field: "other", message: "Tidak dikenal" },
    ]);
    expect(field).toBe("name");
  });

  test("galat 500 jadi galat tingkat form, bukan galat field (test wajib 7)", () => {
    const { calls, setError } = onCollect();

    const field = applyServerError(
      new FetchError(500, "Kesalahan server."),
      setError,
      () => null,
    );

    expect(calls).toEqual([{ field: "root", message: "Kesalahan server." }]);
    expect(field).toBe("root");
  });

  test("galat jaringan jadi galat tingkat form dengan kalimat sendiri", () => {
    const { calls, setError } = onCollect();

    applyServerError(new TypeError("Failed to fetch"), setError);

    expect(calls[0].field).toBe("root");
    expect(calls[0].message).toContain("Periksa koneksi");
  });
});

describe("revealField", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  test("FIRST_INVALID memilih field bergalat pertama menurut urutan DOM", () => {
    document.body.innerHTML = `
      <form>
        <input id="name" />
        <button id="gender" aria-invalid="true"></button>
        <input id="birthPlace" aria-invalid="true" />
      </form>`;
    const gender = document.getElementById("gender") as HTMLElement;
    gender.scrollIntoView = () => {};

    revealField(FIRST_INVALID);

    expect(document.activeElement?.id).toBe("gender");
  });
});
