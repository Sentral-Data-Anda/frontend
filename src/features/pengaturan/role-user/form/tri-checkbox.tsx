import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

import type { CheckState } from "../model";

interface PropTypes extends Omit<
  ComponentProps<"input">,
  "type" | "checked" | "ref"
> {
  state: CheckState;
}

export const TriCheckbox = (props: PropTypes) => {
  const { state, className, ...rest } = props;

  const setIndeterminate = (node: HTMLInputElement | null) => {
    if (node) node.indeterminate = state === "some";
  };

  return (
    <input
      ref={setIndeterminate}
      type="checkbox"
      checked={state === "all"}
      className={cn(
        "accent-primary focus-visible:outline-ring size-4 shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed",
        className,
      )}
      {...rest}
    />
  );
};
