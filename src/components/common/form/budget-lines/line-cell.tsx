"use client";

import type { ReactNode } from "react";

const LABEL = "text-muted-foreground mb-1 block text-caption";

interface PropTypes {
  htmlFor: string;
  label: string;
  index: number;
  className: string;
  isRequired?: boolean;
  isOptional?: boolean;
  children: ReactNode;
}

export const LineCell = (props: PropTypes) => {
  const { htmlFor, label, index, className, isRequired, isOptional, children } =
    props;

  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={htmlFor} className={LABEL}>
        {label}
        {isRequired && <span aria-hidden="true">*</span>}
        {isOptional && (
          <span className="text-muted-foreground"> (opsional)</span>
        )}
        <span className="sr-only"> baris {index + 1}</span>
      </label>
      {children}
    </div>
  );
};
