import { describe, expect, test } from "bun:test";

import { GET } from "./route";

// Server bisa saja berjalan di 0.0.0.0 atau di belakang proxy; alamat internal
// itu tidak boleh bocor ke Location.
const call = () => GET();

describe("GET /api/v1/auth/session-ended", () => {
  test("mengalihkan ke /login dengan Location relatif", async () => {
    const response = await call();

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("/login");
  });

  test("kedua cookie sesi dihapus", async () => {
    const cleared = (await call()).headers.getSetCookie();

    for (const name of ["accessToken", "refreshToken"]) {
      const cookie = cleared.find((value) => value.startsWith(`${name}=;`));

      expect(cookie).toBeDefined();
      expect(cookie).toContain("Path=/");
      expect(cookie).toMatch(/Expires=Thu, 01 Jan 1970|Max-Age=0/);
    }
  });
});
