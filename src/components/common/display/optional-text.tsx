interface PropTypes {
  text?: string | null;
  empty: string;
}

export const OptionalText = (props: PropTypes) => {
  const { text, empty } = props;

  return text ? (
    <span className="block truncate" title={text}>
      {text}
    </span>
  ) : (
    <span className="text-muted-foreground">
      <span aria-hidden>—</span>
      <span className="sr-only">{empty}</span>
    </span>
  );
};
