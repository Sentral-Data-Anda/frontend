import { afterEach, expect, test } from "bun:test";

const original = process.env.NODE_ENV;

afterEach(() => {
  Object.assign(process.env, { NODE_ENV: original });
});

const load = (tag: string): Promise<typeof import("./fixtures")> =>
  import(`./fixtures?${tag}`);

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
