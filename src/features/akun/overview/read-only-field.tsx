import type { ReactNode } from "react";

interface PropTypes {
  label: string;
  children: ReactNode;
}

export const ReadOnlyField = (props: PropTypes) => {
  const { label, children } = props;

  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-muted-foreground shrink-0 text-body">{label}</dt>
      <dd className="min-w-0 text-right text-body font-medium break-words">
        {children}
      </dd>
    </div>
  );
};
