import { createFileRoute, notFound } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { isSafeRedirectPath } from "@/lib/redirect";

const FRAMES = [
  { label: "Mobile", width: 390, height: 844, scale: 1 },
  { label: "Tablet", width: 820, height: 1180, scale: 1 },
  { label: "Desktop", width: 1440, height: 900, scale: 0.5 },
] as const;

function Page() {
  const { path } = Route.useSearch();
  const src = isSafeRedirectPath(path) ? path : "/";

  return (
    <div className="bg-muted min-h-dvh overflow-x-auto p-6">
      <p className="text-muted-foreground mb-4 font-mono text-body">{src}</p>

      <div className="flex w-max items-start gap-6">
        {FRAMES.map((frame) => (
          <figure key={frame.label} className="flex flex-col gap-2">
            <figcaption className="text-body font-medium">
              {frame.label} · {frame.width}×{frame.height}
              {frame.scale !== 1 ? ` (skala ${frame.scale * 100}%)` : ""}
            </figcaption>

            <div
              className="border-border bg-background overflow-hidden rounded-lg border shadow-sm"
              style={{
                width: frame.width * frame.scale,
                height: frame.height * frame.scale,
              }}
            >
              <iframe
                src={src}
                title={`${frame.label} ${frame.width}×${frame.height}`}
                width={frame.width}
                height={frame.height}
                className="block origin-top-left"
                style={{ transform: `scale(${frame.scale})` }}
              />
            </div>
          </figure>
        ))}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/dev/preview/")({
  validateSearch: (search: Record<string, unknown>): { path?: string } => ({
    path: typeof search.path === "string" ? search.path : undefined,
  }),
  beforeLoad: () => {
    if (import.meta.env.PROD) throw notFound();
  },
  head: () => ({ meta: [{ title: withSiteName("Pratinjau responsif") }] }),
  component: Page,
});
