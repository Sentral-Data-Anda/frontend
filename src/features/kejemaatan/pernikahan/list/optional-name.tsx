interface PropTypes {
  name?: string | null;
  empty: string;
}

export const OptionalName = (props: PropTypes) => {
  const { name, empty } = props;

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
};
