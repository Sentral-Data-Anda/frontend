import { describe, expect, test } from "bun:test";

import { FetchError } from "./fetcher";
import { shouldRetryQuery } from "./retry";

describe("shouldRetryQuery", () => {
  /**
   * 500 yang diulang tiga kali bukan cuma sia-sia: user menatap kerangka
   * selama 7–12 detik sebelum pesan galatnya muncul.
   */
  test("status dari server tidak diulang, 4xx maupun 5xx", () => {
    for (const status of [400, 401, 403, 404, 409, 422, 500, 502, 503]) {
      expect(shouldRetryQuery(0, new FetchError(status, "galat"))).toBe(false);
    }
  });

  test("galat jaringan diulang dua kali, lalu menyerah", () => {
    const offline = new TypeError("Failed to fetch");

    expect(shouldRetryQuery(0, offline)).toBe(true);
    expect(shouldRetryQuery(1, offline)).toBe(true);
    expect(shouldRetryQuery(2, offline)).toBe(false);
  });
});
