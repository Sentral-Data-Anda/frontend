import { describe, expect, test } from "bun:test";

import { buildContentSecurityPolicy, generateNonce } from "./csp";

const NONCE = "dGVzdC1ub25jZS12YWx1ZQ==";

function policy(isDev = false) {
  return buildContentSecurityPolicy({ nonce: NONCE, isDev });
}

/** Ambil satu direktif dari string kebijakan. */
function directive(name: string, isDev = false) {
  return policy(isDev)
    .split("; ")
    .find((d) => d.startsWith(`${name} `) || d === name);
}

describe("buildContentSecurityPolicy", () => {
  test("default-src menolak segalanya kecuali origin sendiri", () => {
    expect(directive("default-src")).toBe("default-src 'self'");
  });

  test("nonce ikut ke script-src", () => {
    expect(directive("script-src")).toContain(`'nonce-${NONCE}'`);
  });

  test("style-src TIDAK memakai nonce — nonce tidak berlaku untuk atribut style", () => {
    // Nonce hanya berlaku untuk elemen <style>, tidak pernah untuk atribut
    // `style="..."` yang dirender next/image. Menuliskannya di sini justru
    // membuat browser mengabaikan 'unsafe-inline' di bawah, dan gambar
    // kehilangan gayanya tanpa error apa pun di server.
    expect(directive("style-src")).not.toContain("nonce-");
    expect(directive("style-src")).toContain("'unsafe-inline'");
  });

  test("script-src memakai strict-dynamic agar chunk Next boleh dimuat", () => {
    expect(directive("script-src")).toContain("'strict-dynamic'");
  });

  test("script-src TIDAK PERNAH memakai unsafe-inline — itu membuat CSP sia-sia terhadap XSS", () => {
    // Pelemahan `'unsafe-inline'` hanya boleh ada di `style-src`, dan alasannya
    // ditulis panjang di csp.ts. Begitu ia bocor ke `script-src`, seluruh
    // perlindungan terhadap injeksi skrip hilang.
    expect(directive("script-src", false)).not.toContain("'unsafe-inline'");
    expect(directive("script-src", true)).not.toContain("'unsafe-inline'");
  });

  test("unsafe-eval hanya di development, tidak pernah di production", () => {
    expect(policy(true)).toContain("'unsafe-eval'");
    expect(policy(false)).not.toContain("'unsafe-eval'");
  });

  test("worker-src dan manifest-src ada — tanpa keduanya aplikasi berhenti installable", () => {
    expect(directive("worker-src")).toBe("worker-src 'self'");
    expect(directive("manifest-src")).toBe("manifest-src 'self'");
  });

  test("direktif anti-clickjacking dan anti-injeksi terpasang", () => {
    expect(directive("frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(directive("object-src")).toBe("object-src 'none'");
    expect(directive("base-uri")).toBe("base-uri 'self'");
    expect(directive("form-action")).toBe("form-action 'self'");
  });

  test("upgrade-insecure-requests terpasang", () => {
    expect(directive("upgrade-insecure-requests")).toBe(
      "upgrade-insecure-requests",
    );
  });

  test("tidak ada baris baru — header HTTP harus satu baris", () => {
    expect(policy()).not.toContain("\n");
  });
});

describe("generateNonce", () => {
  test("menghasilkan base64 yang sah", () => {
    expect(generateNonce()).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });

  test("panjangnya minimal 128 bit acak", () => {
    // 16 byte -> 24 karakter base64 dengan padding.
    expect(generateNonce().length).toBeGreaterThanOrEqual(24);
  });

  test("tidak pernah berulang — nonce yang bisa ditebak sama saja tidak ada", () => {
    const seen = new Set(Array.from({ length: 500 }, () => generateNonce()));
    expect(seen.size).toBe(500);
  });
});
