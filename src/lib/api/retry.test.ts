import { describe, expect, test } from "bun:test";

import { FetchError } from "./fetcher";
import { isQueryRetryable } from "./retry";

describe("isQueryRetryable", () => {
  test("status dari server tidak diulang, 4xx maupun 5xx", () => {
    for (const status of [400, 401, 403, 404, 409, 422, 500, 502, 503]) {
      expect(isQueryRetryable(0, new FetchError(status, "galat"))).toBe(false);
    }
  });

  test("galat jaringan diulang dua kali, lalu menyerah", () => {
    const offline = new TypeError("Failed to fetch");

    expect(isQueryRetryable(0, offline)).toBe(true);
    expect(isQueryRetryable(1, offline)).toBe(true);
    expect(isQueryRetryable(2, offline)).toBe(false);
  });
});
