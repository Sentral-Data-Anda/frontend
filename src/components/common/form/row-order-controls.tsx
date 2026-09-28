"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

import { Button } from "@/components/common/control";

import { rowButtonId, type RowButton } from "./use-ordered-rows";

interface PropTypes {
  prefix: string;
  noun: string;
  index: number;
  total: number;
  isDisabled: boolean;
  onMove: (from: number, to: number, button: RowButton) => void;
  onRemove: (index: number) => void;
}

export const RowOrderControls = (props: PropTypes) => {
  const { prefix, noun, index, total, isDisabled, onMove, onRemove } = props;

  const step = index + 1;

  return (
    <div className="flex gap-1">
      <Button
        id={rowButtonId(prefix, index, "up")}
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Naikkan ${noun} ${step}`}
        className="cursor-pointer disabled:cursor-not-allowed"
        disabled={isDisabled || index === 0}
        onClick={() => onMove(index, index - 1, "up")}
      >
        <ArrowUp aria-hidden />
      </Button>

      <Button
        id={rowButtonId(prefix, index, "down")}
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Turunkan ${noun} ${step}`}
        className="cursor-pointer disabled:cursor-not-allowed"
        disabled={isDisabled || index === total - 1}
        onClick={() => onMove(index, index + 1, "down")}
      >
        <ArrowDown aria-hidden />
      </Button>

      <Button
        id={rowButtonId(prefix, index, "remove")}
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Hapus ${noun} ${step}`}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer disabled:cursor-not-allowed"
        disabled={isDisabled || total === 1}
        onClick={() => onRemove(index)}
      >
        <Trash2 aria-hidden />
      </Button>
    </div>
  );
};
