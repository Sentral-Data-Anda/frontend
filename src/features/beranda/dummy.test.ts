import { afterEach, expect, test } from "bun:test";

const original = process.env.NODE_ENV;

afterEach(() => {
  // `NODE_ENV` bertipe readonly di @types/node; di runtime tetap bisa ditulis.
  Object.assign(process.env, { NODE_ENV: original });
});

/**
 * `SHOW_DUMMY` dihitung saat modul dimuat, jadi tiap kasus memuat salinan
 * baru lewat query string — cache modul Bun berkunci pada specifier lengkap.
 */
const load = (tag: string): Promise<typeof import("./dummy")> =>
  import(`./dummy?${tag}`);

test("SHOW_DUMMY false di production", async () => {
  Object.assign(process.env, { NODE_ENV: "production" });

  const { SHOW_DUMMY } = await load("production");

  expect(SHOW_DUMMY).toBe(false);
});

test("SHOW_DUMMY true di development", async () => {
  Object.assign(process.env, { NODE_ENV: "development" });

  const { SHOW_DUMMY } = await load("development");

  expect(SHOW_DUMMY).toBe(true);
});
