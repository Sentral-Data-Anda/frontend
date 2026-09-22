import { describe, expect, test } from "bun:test";

import { cn } from "@/lib/utils";

import { badgeVariants } from "./badge";

describe("badge status", () => {
  test.each(["success", "neutral"] as const)(
    "%s tetap 12px setelah merge",
    (variant) => {
      const classes = cn(badgeVariants({ variant })).split(" ");

      expect(classes).toContain("text-body");
      expect(classes).not.toContain("text-caption");
    },
  );
});
