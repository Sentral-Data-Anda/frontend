import { describe, expect, test } from "bun:test";

import { toReport } from "./report";

describe("toReport", () => {
  test("mengambil name, message, dan digest dari Error", () => {
    const error = Object.assign(new TypeError("gagal"), { digest: "9f8e" });

    expect(toReport("error", error, "/jadwal")).toEqual({
      kind: "error",
      name: "TypeError",
      message: "gagal",
      digest: "9f8e",
      path: "/jadwal",
    });
  });

  test("stack TIDAK ikut — di browser ia memuat URL lengkap tiap frame beserta query", () => {
    expect(toReport("error", new Error("gagal"), "/")).not.toHaveProperty(
      "stack",
    );
  });

  test("cause TIDAK ikut", () => {
    const error = new Error("gagal", { cause: { nik: "3175000000000000" } });
    const result = toReport("error", error, "/");

    expect(result).not.toHaveProperty("cause");
    expect(JSON.stringify(result)).not.toContain("3175000000000000");
  });

  test("promise yang ditolak dengan nilai bukan Error tetap terlaporkan", () => {
    expect(toReport("unhandledrejection", "timeout", "/jemaat")).toEqual({
      kind: "unhandledrejection",
      name: "UnknownError",
      message: "timeout",
      path: "/jemaat",
    });
  });

  test("pesan sangat panjang dipotong sebelum dikirim", () => {
    const result = toReport("error", new Error("z".repeat(5_000)), "/");
    expect(result.message.length).toBe(1_000);
  });

  test("path dipakai apa adanya dari pemanggil — pemanggil mengirim pathname tanpa query", () => {
    expect(toReport("error", new Error("x"), "/jemaat/42").path).toBe(
      "/jemaat/42",
    );
  });

  test("digest tidak dimunculkan bila tidak ada", () => {
    expect(toReport("error", new Error("x"), "/")).not.toHaveProperty("digest");
  });
});
