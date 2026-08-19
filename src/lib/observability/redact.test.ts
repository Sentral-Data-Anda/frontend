import { describe, expect, test } from "bun:test";

import {
  MAX_MESSAGE_LENGTH,
  redactError,
  redactHeaders,
  redactPath,
  truncate,
} from "./redact";

describe("redactHeaders", () => {
  test("kredensial ditandai redacted, bukan dibuang — perlu tahu bahwa header itu ada", () => {
    const result = redactHeaders({
      Authorization: "Bearer rahasia",
      cookie: "session=rahasia",
      "Set-Cookie": "session=rahasia",
    });

    expect(result).toEqual({
      authorization: "[redacted]",
      cookie: "[redacted]",
      "set-cookie": "[redacted]",
    });
    expect(JSON.stringify(result)).not.toContain("rahasia");
  });

  test("nonce CSP tidak pernah bocor ke log", () => {
    expect(redactHeaders({ "x-nonce": "abc123" })["x-nonce"]).toBe(
      "[redacted]",
    );
  });

  test("header dalam daftar putih dicatat apa adanya", () => {
    expect(redactHeaders({ "User-Agent": "Chrome/1" })).toEqual({
      "user-agent": "Chrome/1",
    });
  });

  test("header yang tidak dikenal dibuang — daftar putih, bukan daftar hitam", () => {
    expect(redactHeaders({ "x-internal-user-id": "42" })).toEqual({});
  });

  test("referer dibuang karena kerap membawa query string halaman sebelumnya", () => {
    expect(
      redactHeaders({ referer: "https://a.test/jemaat?nama=Budi" }),
    ).toEqual({});
  });

  test("nilai berupa array digabung", () => {
    expect(redactHeaders({ "accept-language": ["id", "en"] })).toEqual({
      "accept-language": "id, en",
    });
  });
});

describe("redactPath", () => {
  test("query string dibuang — bisa memuat token atau nama jemaat", () => {
    expect(redactPath("/jemaat?nama=Budi&token=abc")).toBe("/jemaat");
  });

  test("fragment juga dibuang", () => {
    expect(redactPath("/jadwal#minggu")).toBe("/jadwal");
  });

  test("path tanpa query dibiarkan utuh", () => {
    expect(redactPath("/jadwal/123")).toBe("/jadwal/123");
  });
});

describe("truncate", () => {
  test("teks pendek tidak diubah", () => {
    expect(truncate("halo")).toBe("halo");
  });

  test("teks panjang dipotong dan ditandai", () => {
    const result = truncate("x".repeat(MAX_MESSAGE_LENGTH + 50));
    expect(result.length).toBeLessThan(MAX_MESSAGE_LENGTH + 20);
    expect(result).toContain("[dipotong]");
  });
});

describe("redactError", () => {
  test("mengambil name, message, dan digest", () => {
    const error = Object.assign(new Error("gagal"), { digest: "1a2b3c" });
    expect(redactError(error)).toEqual({
      name: "Error",
      message: "gagal",
      digest: "1a2b3c",
    });
  });

  test("cause TIDAK PERNAH ikut — di apiClient ia memuat data jemaat yang ditolak Zod", () => {
    const error = new Error("Respons tidak sesuai schema", {
      cause: { nama: "Budi Santoso", nik: "3175000000000000" },
    });

    const result = redactError(error);

    expect(result).not.toHaveProperty("cause");
    expect(JSON.stringify(result)).not.toContain("Budi");
    expect(JSON.stringify(result)).not.toContain("3175000000000000");
  });

  test("stack tidak ikut — di browser memuat URL lengkap beserta query", () => {
    expect(redactError(new Error("gagal"))).not.toHaveProperty("stack");
  });

  test("pesan panjang tetap dipotong", () => {
    const result = redactError(new Error("y".repeat(MAX_MESSAGE_LENGTH + 100)));
    expect(result.message).toContain("[dipotong]");
  });

  test("nilai non-Error tetap tertangani", () => {
    expect(redactError("meledak")).toEqual({
      name: "UnknownError",
      message: "meledak",
    });
  });

  test("digest tidak dimunculkan bila memang tidak ada", () => {
    expect(redactError(new Error("gagal"))).not.toHaveProperty("digest");
  });
});
