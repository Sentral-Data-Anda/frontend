/* eslint-disable no-console -- skrip CLI: hasilnya dicetak ke terminal */
/**
 * `bun scripts/smoke-routes.ts` — membuka setiap rute di `src/routeTree.gen.ts`
 * pada `bun run dev:mock` yang sedang berjalan, sebagai admin.
 *
 * Gagal bila sebuah rute melempar galat halaman, menulis console.error, atau
 * menampilkan layar galat. Parameter rute dinamis diisi dari tautan yang
 * benar-benar dirender layar lain; rute yang tidak punya tautan semacam itu
 * dibuka dengan nilai contoh dan dilaporkan terpisah.
 *
 *   BASE=http://localhost:3000 bun scripts/smoke-routes.ts
 *   BASE=http://localhost:3300 SMOKE_USER=… SMOKE_PASS=… bun scripts/smoke-routes.ts
 *
 * Service worker diblokir: ia diuji terpisah, dan selama aktif Chromium tidak
 * pernah melaporkan `networkidle`.
 */
import { chromium, type Page } from "playwright-core";

const BASE = process.env.BASE ?? "http://localhost:3000";
const PARALLEL = Number(process.env.PARALLEL ?? 4);
const ERROR_SCREENS = ["Terjadi kesalahan", "Aplikasi gagal dimuat"];
// Rute yang dibuka lewat tautan nyata tidak boleh berakhir di layar 404.
const NOT_FOUND_SCREENS = ["Halaman tidak ditemukan", "Layar belum tersedia"];
// Peramban mencatat setiap jawaban 4xx/5xx sebagai console.error. Yang dinilai
// di sini adalah reaksi layarnya, bukan jawabannya.
const NETWORK_NOISE = /Failed to load resource: the server responded/;
const SAMPLE_PARAM = "1";

type Outcome = {
  path: string;
  url: string;
  problems: string[];
  isSampled: boolean;
};

const tree = await Bun.file("src/routeTree.gen.ts").text();
const block =
  tree.match(/export interface FileRoutesByFullPath \{([\s\S]*?)\n\}/)?.[1] ??
  "";
const routes = [...block.matchAll(/^\s+'([^']+)':/gm)]
  .map(([, path]) => path.replace(/\/$/, "") || "/")
  .filter((path) => !path.startsWith("/dev"));

const isDynamic = (path: string) => path.includes("$");
const toPattern = (path: string) =>
  new RegExp(`^${path.replace(/\$[A-Za-z]+/g, "[^/?#]+")}$`);

const browser = await chromium.launch();
const context = await browser.newContext({ serviceWorkers: "block" });
const login = await context.newPage();

await login.goto(`${BASE}/login`);
await login.fill("#username", process.env.SMOKE_USER ?? "admin");
await login.fill("#password", process.env.SMOKE_PASS ?? "smoke");
await login.getByRole("button", { name: "Masuk" }).click();
await login.waitForURL((url) => url.pathname === "/", { timeout: 30_000 });
await login.close();

const seenLinks = new Set<string>();

const visit = async (
  page: Page,
  path: string,
  url: string,
  isSampled = false,
) => {
  const problems: string[] = [];
  const onError = (error: Error) =>
    problems.push(`pageerror: ${error.message}`);
  const onConsole = (message: { type(): string; text(): string }) => {
    if (message.type() === "error" && !NETWORK_NOISE.test(message.text())) {
      problems.push(`console: ${message.text().slice(0, 200)}`);
    }
  };

  page.on("pageerror", onError);
  page.on("console", onConsole);

  try {
    await page.goto(`${BASE}${url}`, {
      waitUntil: "networkidle",
      timeout: 30_000,
    });

    const body = (await page.locator("body").innerText()).slice(0, 5_000);

    for (const screen of ERROR_SCREENS) {
      if (body.includes(screen)) problems.push(`layar galat: ${screen}`);
    }
    for (const screen of isSampled ? [] : NOT_FOUND_SCREENS) {
      if (body.includes(screen)) problems.push(`layar 404: ${screen}`);
    }
    if (new URL(page.url()).pathname === "/login")
      problems.push("terlempar ke /login");

    for (const href of await page.$$eval("a[href^='/']", (links) =>
      links.map((link) => link.getAttribute("href") ?? ""),
    )) {
      seenLinks.add(href.split("#")[0]);
    }
  } catch (error) {
    problems.push(`gagal dibuka: ${(error as Error).message.split("\n")[0]}`);
  } finally {
    page.off("pageerror", onError);
    page.off("console", onConsole);
  }

  return { path, url, problems, isSampled } satisfies Outcome;
};

const runAll = async (
  jobs: { path: string; url: string; isSampled?: boolean }[],
) => {
  const outcomes: Outcome[] = [];
  const queue = [...jobs];
  const pages = await Promise.all(
    Array.from({ length: PARALLEL }, () => context.newPage()),
  );

  await Promise.all(
    pages.map(async (page) => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        outcomes.push(await visit(page, job.path, job.url, job.isSampled));
      }
    }),
  );
  await Promise.all(pages.map((page) => page.close()));

  return outcomes;
};

const staticOutcomes = await runAll(
  routes
    .filter((path) => !isDynamic(path))
    .map((path) => ({ path, url: path })),
);

const dynamicJobs = routes.filter(isDynamic).map((path) => {
  const pattern = toPattern(path);
  const linked = [...seenLinks].find((href) =>
    pattern.test(href.split("?")[0]),
  );

  return linked
    ? { path, url: linked }
    : {
        path,
        url: path.replace(/\$[A-Za-z]+/g, SAMPLE_PARAM),
        isSampled: true,
      };
});
const dynamicOutcomes = await runAll(dynamicJobs);

await browser.close();

const outcomes = [...staticOutcomes, ...dynamicOutcomes];
const failed = outcomes.filter((outcome) => outcome.problems.length > 0);
const sampled = outcomes.filter((outcome) => outcome.isSampled);

console.log(
  `rute dibuka: ${outcomes.length} (statis ${staticOutcomes.length}, dinamis ${dynamicOutcomes.length})`,
);
console.log(
  `rute dinamis dari tautan nyata: ${dynamicOutcomes.length - sampled.length}, dengan nilai contoh: ${sampled.length}`,
);
for (const outcome of sampled) console.log(`  nilai contoh: ${outcome.url}`);
console.log(`bermasalah: ${failed.length}`);
for (const outcome of failed) {
  console.log(`  ${outcome.url}${outcome.isSampled ? " (nilai contoh)" : ""}`);
  for (const problem of [...new Set(outcome.problems)].slice(0, 3))
    console.log(`    ${problem}`);
}

process.exit(failed.length === 0 ? 0 : 1);
