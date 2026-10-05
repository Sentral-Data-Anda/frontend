"use client";

import { Button } from "@/components/common/control";
import { OptionalText } from "@/components/common/display";
import { useBoolean } from "@/hooks/use-boolean";
import { cn } from "@/lib/utils";

import { formatChangeValue } from "../model";

const JSON_LINE_LIMIT = 20;

interface PropTypes {
  value: unknown;
  isAfter?: boolean;
}

export const ChangeValue = (props: PropTypes) => {
  const { value, isAfter = false } = props;

  const isExpanded = useBoolean();
  const { text, isJson } = formatChangeValue(value);
  const lines = isJson && text ? text.split("\n") : [];
  const isClipped = lines.length > JSON_LINE_LIMIT;
  const tone = isAfter ? "text-foreground" : "text-muted-foreground";

  if (!text) return <OptionalText empty="Kosong" />;

  if (!isJson) {
    return (
      <span
        className={cn(
          "block text-body wrap-break-word whitespace-pre-wrap",
          tone,
          isAfter && "font-medium",
        )}
      >
        {text}
      </span>
    );
  }

  return (
    <div className="min-w-0">
      <pre
        className={cn(
          "bg-muted rounded-control px-2.5 py-2 font-mono text-caption break-all whitespace-pre-wrap",
          tone,
        )}
      >
        {isClipped && !isExpanded.value
          ? lines.slice(0, JSON_LINE_LIMIT).join("\n")
          : text}
      </pre>

      {isClipped ? (
        <Button
          type="button"
          variant="link"
          aria-expanded={isExpanded.value}
          onClick={isExpanded.onToggle}
          className="px-0"
        >
          {isExpanded.value
            ? "Tampilkan lebih sedikit"
            : `Tampilkan semua (${lines.length} baris)`}
        </Button>
      ) : null}
    </div>
  );
};
