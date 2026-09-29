"use client";

import {
  useLayoutEffect,
  useRef,
  type ChangeEvent,
  type ComponentProps,
  type Ref,
} from "react";

import { groupAmount, toDecimal, toDigits } from "@/lib/number";
import { cn } from "@/lib/utils";

import { Input } from "./input";

interface PropTypes extends Omit<
  ComponentProps<typeof Input>,
  "value" | "onChange" | "inputMode" | "ref"
> {
  ref?: Ref<HTMLInputElement>;
  value: string;
  onValueChange: (value: string) => void;
  maxDigits: number;
  maxFraction?: number;
}

const SIGNIFICANT = /[\d,]/g;

const countSignificant = (text: string) => text.match(SIGNIFICANT)?.length ?? 0;

const caretAfter = (text: string, count: number) => {
  let seen = 0;

  for (let index = 0; index < text.length; index += 1) {
    if (seen === count) return index;
    if (/[\d,]/.test(text[index] ?? "")) seen += 1;
  }

  return text.length;
};

export const AmountInput = (props: PropTypes) => {
  const {
    ref,
    value,
    onValueChange,
    maxDigits,
    maxFraction = 0,
    className,
    ...rest
  } = props;

  const nodeRef = useRef<HTMLInputElement | null>(null);
  const caretRef = useRef<number | null>(null);
  const display = groupAmount(value);

  const setNode = (node: HTMLInputElement | null) => {
    nodeRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value: typed, selectionStart } = event.target;
    caretRef.current = countSignificant(
      typed.slice(0, selectionStart ?? typed.length),
    );
    onValueChange(
      maxFraction > 0
        ? toDecimal(typed, maxDigits, maxFraction)
        : toDigits(typed, maxDigits),
    );
  };

  useLayoutEffect(() => {
    const node = nodeRef.current;
    const count = caretRef.current;

    if (!node || count === null || document.activeElement !== node) return;

    caretRef.current = null;
    const position = caretAfter(node.value, count);
    node.setSelectionRange(position, position);
  });

  return (
    <Input
      {...rest}
      ref={setNode}
      value={display}
      onChange={onChange}
      inputMode={maxFraction > 0 ? "decimal" : "numeric"}
      autoComplete="off"
      className={cn("text-right tabular-nums", className)}
    />
  );
};
