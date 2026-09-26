import { expect, test } from "bun:test";

import { cn, emptyToNull } from "./utils";

test("cn: token ukuran teks tidak dibuang oleh warna teks", () => {
  expect(cn("text-body", "text-primary-foreground")).toBe(
    "text-body text-primary-foreground",
  );
  expect(cn("text-body", "text-caption")).toBe("text-caption");
});

test("emptyToNull: teks kosong atau spasi jadi null", () => {
  expect(emptyToNull("  ")).toBeNull();
  expect(emptyToNull(" a ")).toBe("a");
});
