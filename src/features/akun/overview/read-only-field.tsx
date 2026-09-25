import type { ReactNode } from "react";

interface PropTypes {
  label: string;
  children: ReactNode;
}

export const ReadOnlyField = (props: PropTypes) => {
  const { label, children } = props;

  return (
    <dl className="min-w-0">
      <dt className="text-muted-foreground mb-1 text-body">{label}</dt>
      <dd className="text-body font-medium break-words">{children}</dd>
    </dl>
  );
};
