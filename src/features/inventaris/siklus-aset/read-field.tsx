import type { ReactNode } from "react";

interface PropTypes {
  label: string;
  hint?: string;
  children: ReactNode;
}

export const ReadField = (props: PropTypes) => {
  const { label, hint, children } = props;

  return (
    <div>
      <p className="mb-1.5 text-body font-medium">{label}</p>
      <p className="flex min-h-9 items-center text-body">{children}</p>
      {hint ? (
        <p className="text-muted-foreground mt-1.5 text-caption">{hint}</p>
      ) : null}
    </div>
  );
};
