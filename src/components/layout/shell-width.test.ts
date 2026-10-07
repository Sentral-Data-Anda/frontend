import { describe, expect, test } from "bun:test";

import { shellWidth, shellWidthFull } from "./shell-width";

describe("lebar kolom", () => {
  test("cetak membuang batas lebar di kedua kolom, jadi layar cetak tidak menimpanya sendiri", () => {
    const columns = { shellWidth, shellWidthFull };

    expect(Object.keys(columns)).toHaveLength(2);
    for (const width of Object.values(columns)) {
      expect(width.split(" ")).toContain("print:max-w-none");
    }
  });
});
