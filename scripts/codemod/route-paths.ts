/**
 * Pemetaan berkas rute Next App Router ke TanStack Router berbasis berkas.
 * Dipakai codemod dan skrip penghitung rute supaya keduanya sepakat.
 */
export const GROUPS: Record<string, string> = {
  "(app)": "_app",
  "(auth)": "_auth",
};

/** `src/app/(app)/hr/[code]/page.tsx` → `_app/hr/$code/index.tsx` */
export function toRouteFile(pagePath: string): string {
  const segments = pagePath
    .replace(/^src\/app\//, "")
    .replace(/\/?page\.tsx$/, "")
    .split("/")
    .filter(Boolean)
    .map(
      (segment) => GROUPS[segment] ?? segment.replace(/^\[(\w+)\]$/, "$$$1"),
    );

  return [...segments, "index.tsx"].join("/");
}

/** Id rute untuk `createFileRoute`, mis. `/_app/hr/$code/`. */
export function toRouteId(routeFile: string): string {
  return `/${routeFile.replace(/index\.tsx$/, "")}`;
}

/** Path yang dilihat pengguna, mis. `/hr/$code`. */
export function toFullPath(routeFile: string): string {
  const path = routeFile
    .replace(/index\.tsx$/, "")
    .split("/")
    .filter((segment) => segment && !segment.startsWith("_"))
    .join("/");

  return `/${path}`;
}
