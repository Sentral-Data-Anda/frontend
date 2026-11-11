import { afterEach, expect, test } from "bun:test";

// Di Bun `import.meta.env` adalah `process.env`; Vite mengisi PROD saat build.
afterEach(() => {
  delete process.env.PROD;
});

const load = (tag: string): Promise<typeof import("./fixtures")> =>
  import(`./fixtures?${tag}`);

test("SHOW_DUMMY false di production", async () => {
  process.env.PROD = "true";

  const { SHOW_DUMMY } = await load("production");

  expect(SHOW_DUMMY).toBe(false);
});

test("SHOW_DUMMY true di development", async () => {
  delete process.env.PROD;

  const { SHOW_DUMMY } = await load("development");

  expect(SHOW_DUMMY).toBe(true);
});
