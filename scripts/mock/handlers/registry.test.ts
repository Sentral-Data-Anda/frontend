import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "bun:test";

import { MOCK_HANDLERS } from "./index";

const HERE = join(import.meta.dir);

const exportNameOf = (file: string) =>
  `${file
    .replace(/\.ts$/, "")
    .replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())}Mock`;

// Handler yang berkasnya ada tapi tidak terdaftar akan diam saja: test fiturnya
// tetap hijau karena memanggil handler langsung, sementara aplikasi menjawab
// 404. Penggabungan cabang yang menghilangkan satu baris impor adalah cara
// paling mungkin itu terjadi, jadi dijaga di sini.
describe("registry handler mock", () => {
  const files = readdirSync(HERE).filter(
    (name) =>
      name.endsWith(".ts") && !name.endsWith(".test.ts") && name !== "index.ts",
  );

  test("setiap berkas handler terdaftar di MOCK_HANDLERS", async () => {
    const missing: string[] = [];

    for (const file of files) {
      const name = exportNameOf(file);
      const loaded = (await import(join(HERE, file))) as Record<
        string,
        unknown
      >;
      const handler = loaded[name];

      if (handler && !MOCK_HANDLERS.includes(handler as never)) {
        missing.push(`${file} → ${name}`);
      }
    }

    expect(missing).toEqual([]);
  });

  test("setiap berkas handler mengekspor nama yang disepakati", async () => {
    const unnamed: string[] = [];

    for (const file of files) {
      const loaded = (await import(join(HERE, file))) as Record<
        string,
        unknown
      >;

      if (!loaded[exportNameOf(file)]) unnamed.push(file);
    }

    expect(unnamed).toEqual([]);
  });

  test("tidak ada handler terdaftar dua kali", () => {
    expect(new Set(MOCK_HANDLERS).size).toBe(MOCK_HANDLERS.length);
  });
});
