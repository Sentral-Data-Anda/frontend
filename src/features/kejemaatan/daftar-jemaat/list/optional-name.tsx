export function OptionalName({
  name,
  empty,
}: {
  name?: string;
  empty: string;
}) {
  return name ? (
    <span className="block truncate" title={name}>
      {name}
    </span>
  ) : (
    <span className="text-muted-foreground">
      <span aria-hidden>—</span>
      <span className="sr-only">{empty}</span>
    </span>
  );
}
