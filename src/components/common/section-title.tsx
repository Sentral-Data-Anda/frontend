import { cn } from "@/lib/utils";

export function SectionTitle({
  title,
  subtitle,
  align = "left",
  className,
}: {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-8 space-y-2",
        align === "center" && "text-center",
        className,
      )}
    >
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="text-muted-foreground sm:text-lg">{subtitle}</p>
      ) : null}
    </div>
  );
}
