/* eslint-disable no-console -- skrip CLI: hasilnya dicetak ke terminal */
/**
 * `bun scripts/codemod/count-routes.ts [ref]` — membandingkan halaman Next di
 * `src/app` pada commit `ref` (bawaan `HEAD`) dengan rute di
 * `src/routeTree.gen.ts`. Gagal bila ada halaman yang tidak punya rute.
 */
import { toFullPath, toRouteFile } from "./route-paths";

// Halaman yang sengaja menjadi berkas statis, bukan rute.
const STATIC_PAGES: Record<string, string> = {
  "src/app/offline/page.tsx": "public/offline.html",
};

const ref = process.argv[2] ?? "HEAD";
const listing = Bun.spawnSync([
  "git",
  "ls-tree",
  "-r",
  "--name-only",
  ref,
  "src/app",
]);
const pages = listing.stdout
  .toString()
  .split("\n")
  .filter((file) => file.endsWith("/page.tsx"));

const tree = await Bun.file("src/routeTree.gen.ts").text();
const block =
  tree.match(/export interface FileRoutesByFullPath \{([\s\S]*?)\n\}/)?.[1] ??
  "";
const routes = new Set(
  [...block.matchAll(/^\s+'([^']+)':/gm)].map(
    ([, path]) => path.replace(/\/$/, "") || "/",
  ),
);

const missing: string[] = [];
let staticCount = 0;

for (const page of pages) {
  if (page in STATIC_PAGES) {
    if (await Bun.file(STATIC_PAGES[page]).exists()) staticCount += 1;
    else missing.push(`${page} → ${STATIC_PAGES[page]}`);
    continue;
  }

  const path = toFullPath(toRouteFile(page));

  if (!routes.has(path)) missing.push(`${page} → ${path}`);
}

console.log(`halaman Next (${ref}): ${pages.length}`);
console.log(`rute di routeTree.gen.ts: ${routes.size}`);
console.log(`halaman menjadi berkas statis: ${staticCount}`);
console.log(`halaman tanpa rute: ${missing.length}`);
for (const line of missing) console.log(`  ${line}`);

process.exit(
  missing.length === 0 && pages.length === routes.size + staticCount ? 0 : 1,
);
