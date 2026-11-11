/* eslint-disable no-console -- skrip CLI: hasilnya dicetak ke terminal */
/**
 * `bun scripts/codemod/next-imports.ts` — mengganti API Next di kode fitur dan
 * test dengan padanannya, tanpa menyentuh isi layar:
 *
 * - `"use client"` dihapus;
 * - `next/link` → `AppLink` dari `@/components/common/link`;
 * - `useRouter`/`useSearchParams`/`usePathname` dari `next/navigation` →
 *   `useAppRouter`/`useAppSearchParams`/`useAppPathname` dari
 *   `@/hooks/use-app-router`;
 * - `mock.module("next/navigation", …)` di test → modul adapter yang sama.
 *
 * `redirect`/`notFound` dan impor Next lain tidak disentuh dan dilaporkan.
 */
import { Glob } from "bun";

const HOOKS: Record<string, string> = {
  useRouter: "useAppRouter",
  useSearchParams: "useAppSearchParams",
  usePathname: "useAppPathname",
};

const ADAPTER = "@/hooks/use-app-router";
const NAV_IMPORT = /import \{([^}]*)\} from "next\/navigation";\n/;
const LINK_IMPORT = /import Link from "next\/link";\n/;
const USE_CLIENT = /^(?:\/\/[^\n]*\n)*["']use client["'];?\n+/;

export function transformSource(source: string): {
  output: string;
  leftovers: string[];
} {
  let output = source.replace(USE_CLIENT, "");
  const leftovers: string[] = [];

  if (LINK_IMPORT.test(output)) {
    output = output
      .replace(
        LINK_IMPORT,
        'import { AppLink } from "@/components/common/link";\n',
      )
      .replace(/<Link\b/g, "<AppLink")
      .replace(/<\/Link>/g, "</AppLink>");
  }

  const nav = output.match(NAV_IMPORT);

  if (nav) {
    const names = nav[1]
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
    const hooks = names.filter((name) => name in HOOKS);
    const rest = names.filter((name) => !(name in HOOKS));

    const replacement = [
      hooks.length
        ? `import { ${hooks
            .map((name) => HOOKS[name])
            .sort()
            .join(", ")} } from "${ADAPTER}";\n`
        : "",
      rest.length
        ? `import { ${rest.join(", ")} } from "next/navigation";\n`
        : "",
    ].join("");

    output = output.replace(NAV_IMPORT, replacement);

    for (const name of hooks) {
      output = output.replace(
        new RegExp(`\\b${name}\\(`, "g"),
        `${HOOKS[name]}(`,
      );
    }

    if (rest.length) leftovers.push(`next/navigation: ${rest.join(", ")}`);
  }

  output = output.replace(
    /mock\.module\(\s*"next\/navigation",\s*\(\)\s*=>\s*\(\{([\s\S]*?)\}\)\s*\);/g,
    (_block, body: string) => {
      const renamed = body.replace(
        /(^|[\s{,])(useRouter|useSearchParams|usePathname)(\s*:)/g,
        (_match, lead: string, name: string, colon: string) =>
          `${lead}${HOOKS[name]}${colon}`,
      );

      return `mock.module("${ADAPTER}", () => ({${renamed}}));`;
    },
  );

  for (const match of output.matchAll(/from "(next(?:\/[\w/-]+)?)"/g)) {
    if (match[1] !== "next/navigation") leftovers.push(match[1]);
  }

  if (/["']next\/navigation["']/.test(output) && !nav) {
    leftovers.push("next/navigation (di luar impor)");
  }

  return { output, leftovers };
}

if (import.meta.main) {
  const roots = process.argv.slice(2);
  const pattern = `{${(roots.length ? roots : ["src", "tests"]).join(",")}}/**/*.{ts,tsx}`;
  let changed = 0;
  const report: string[] = [];

  for await (const file of new Glob(pattern).scan(".")) {
    if (file.startsWith("src/app/") || file.endsWith("routeTree.gen.ts"))
      continue;

    const source = await Bun.file(file).text();
    const { output, leftovers } = transformSource(source);

    if (output !== source) {
      await Bun.write(file, output);
      changed += 1;
    }

    for (const leftover of leftovers) report.push(`${file}: ${leftover}`);
  }

  console.log(`diubah: ${changed}`);
  for (const line of report) console.log(`  sisa ${line}`);
}
