import { describe, expect, test } from "bun:test";

import { toMediaTarget } from "./media";

const UPSTREAM = "http://sada-minio:9000";
const SIGNED = "X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=abc123";

const target = (path: string, upstream: string | null = UPSTREAM) =>
  toMediaTarget(
    new URL(`https://app.example.com${path}`),
    upstream ?? undefined,
  );

describe("toMediaTarget", () => {
  test("membuang awalan /media dan menjaga path serta query apa adanya", () => {
    expect(target(`/media/sada/gallery/a.jpeg?${SIGNED}`)?.href).toBe(
      `http://sada-minio:9000/sada/gallery/a.jpeg?${SIGNED}`,
    );
  });

  test("karakter ter-escape pada kunci tidak di-encode ulang", () => {
    expect(target(`/media/sada/a%20b/x.pdf?${SIGNED}`)?.href).toBe(
      `http://sada-minio:9000/sada/a%20b/x.pdf?${SIGNED}`,
    );
  });

  test("tanpa tanda tangan ditolak, supaya bukan proxy terbuka ke bucket", () => {
    expect(target("/media/sada/gallery/a.jpeg")).toBeNull();
  });

  test("tanpa MEDIA_UPSTREAM_URL ditolak", () => {
    expect(target(`/media/sada/a.jpeg?${SIGNED}`, null)).toBeNull();
    expect(target(`/media/sada/a.jpeg?${SIGNED}`, "")).toBeNull();
  });

  test("path di luar /media ditolak", () => {
    expect(target(`/mediaX/sada/a.jpeg?${SIGNED}`)).toBeNull();
    expect(target(`/api/sada/a.jpeg?${SIGNED}`)).toBeNull();
  });

  test("kunci berawalan // tidak menggeser host tujuan", () => {
    expect(target(`/media//evil.example.com/a.jpeg?${SIGNED}`)?.host).toBe(
      "sada-minio:9000",
    );
  });
});
