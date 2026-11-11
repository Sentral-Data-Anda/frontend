/* eslint-disable no-console -- skrip CLI: hasilnya dicetak ke terminal */
/**
 * `bun scripts/codemod/next-to-tanstack.ts` — memindahkan halaman tipis
 * `src/app/**\/page.tsx` ke `src/routes/**\/index.tsx`.
 *
 * Hanya bentuk yang dikenali yang ditulis: metadata judul berupa string,
 * komponen default `Page`, dan `params` yang langsung didestruktur. Halaman
 * lain disebut di akhir dan ditulis tangan.
 */
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

import { Glob } from "bun";

import { toRouteFile, toRouteId } from "./route-paths";

// Ditulis tangan: memakai server, cookie, searchParams, atau notFound().
const MANUAL = new Set([
  "src/app/(app)/page.tsx",
  "src/app/(auth)/login/page.tsx",
  "src/app/(auth)/authentication/page.tsx",
  "src/app/(app)/[domain]/page.tsx",
  "src/app/(app)/[domain]/[screen]/page.tsx",
  "src/app/(app)/fixed-asset/asset-transaction/page.tsx",
  "src/app/dev/preview/page.tsx",
  "src/app/dev/anggaran-kit/page.tsx",
  "src/app/offline/page.tsx",
]);

const METADATA =
  /export const metadata(?::\s*Metadata)?\s*=\s*\{\s*title:\s*("(?:[^"\\]|\\.)*")\s*,?\s*\};\n+/;
const METADATA_IMPORT = /import type \{ Metadata \} from "next";\n+/;
const DEFAULT_PAGE =
  /export default (?:async )?function Page\(([\s\S]*?)\)(?:: [^{]+)? \{/;
const AWAIT_PARAMS = /const (\{ [\w, ]+ \}) = await (?:props\.)?params;/;

type Result = { file: string; route?: string; reason?: string };

export function transformPage(source: string, routeId: string): string {
  const title = source.match(METADATA)?.[1];

  if (!title) throw new Error("metadata judul tidak dikenali");

  const page = source.match(DEFAULT_PAGE);

  if (!page) throw new Error("komponen default Page tidak dikenali");

  const hasParams = page[1].trim() !== "";
  let output = source
    .replace(METADATA, "")
    .replace(METADATA_IMPORT, "")
    .replace(DEFAULT_PAGE, "function Page() {");

  if (hasParams) {
    if (!AWAIT_PARAMS.test(output)) throw new Error("params tidak dikenali");

    output = output.replace(AWAIT_PARAMS, "const $1 = Route.useParams();");
  }

  if (/\bawait\b|\bparams\b/.test(output.replace(/Route\.useParams/, ""))) {
    throw new Error("masih ada await/params tersisa");
  }

  return [
    'import { createFileRoute } from "@tanstack/react-router";',
    'import { withSiteName } from "@/config/site";',
    output.trimEnd(),
    "",
    `export const Route = createFileRoute("${routeId}")({`,
    `  head: () => ({ meta: [{ title: withSiteName(${title}) }] }),`,
    "  component: Page,",
    "});",
    "",
  ].join("\n");
}

if (import.meta.main) {
  const results: Result[] = [];

  for await (const file of new Glob("src/app/**/page.tsx").scan(".")) {
    if (MANUAL.has(file)) {
      results.push({ file, reason: "manual" });
      continue;
    }

    const routeFile = toRouteFile(file);
    const target = `src/routes/${routeFile}`;

    try {
      const output = transformPage(
        await Bun.file(file).text(),
        toRouteId(routeFile),
      );

      await mkdir(dirname(target), { recursive: true });
      await Bun.write(target, output);
      results.push({ file, route: target });
    } catch (error) {
      results.push({ file, reason: (error as Error).message });
    }
  }

  const written = results.filter((result) => result.route);
  const skipped = results.filter((result) => !result.route);

  console.log(`ditulis: ${written.length}, dilewati: ${skipped.length}`);
  for (const result of skipped)
    console.log(`  ${result.reason}: ${result.file}`);
}
