"use client";

import type { ReactNode } from "react";

const LABEL = "text-muted-foreground mb-1 block text-caption";

interface PropTypes {
  htmlFor: string;
  label: string;
  index: number;
  className: string;
  children: ReactNode;
}

export const LineCell = (props: PropTypes) => {
  const { htmlFor, label, index, className, children } = props;

  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={htmlFor} className={LABEL}>
        {label}
        <span className="sr-only"> baris {index + 1}</span>
      </label>
      {children}
    </div>
  );
};
