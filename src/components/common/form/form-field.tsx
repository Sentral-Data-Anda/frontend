import { cloneElement, type ReactElement, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { FieldLabel } from "./field-label";

export type FieldControlProps = {
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  "aria-required"?: boolean;
};

interface PropTypes {
  label: ReactNode;
  htmlFor: string;
  error?: string;
  hint?: string;
  isHintWarning?: boolean;
  isRequired?: boolean;
  children: ReactElement<FieldControlProps>;
}

export const FormField = (props: PropTypes) => {
  const {
    label,
    htmlFor,
    error,
    hint,
    isHintWarning = false,
    isRequired = false,
    children,
  } = props;

  const message = error ?? hint;
  const messageId = message
    ? `${htmlFor}-${error ? "error" : "hint"}`
    : undefined;

  return (
    <div>
      <FieldLabel
        htmlFor={htmlFor}
        isRequired={isRequired}
        className="mb-1.5 block text-body font-medium"
      >
        {label}
      </FieldLabel>

      {cloneElement(children, {
        id: htmlFor,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": messageId,
        "aria-required": isRequired || undefined,
      })}

      {message ? (
        <p
          id={messageId}
          className={cn(
            "mt-1.5 text-caption",
            error
              ? "text-destructive text-body"
              : isHintWarning
                ? "border-warning bg-warning/10 rounded-control border px-2 py-0.5"
                : "text-muted-foreground",
          )}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
};
