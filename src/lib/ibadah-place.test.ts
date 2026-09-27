import { describe, expect, test } from "bun:test";

import { placeLabelOf, type IbadahPlace } from "./ibadah-place";

const place = (overrides: Partial<IbadahPlace>): IbadahPlace => ({
  placeType: "GEREJA",
  room: null,
  hostKeluarga: null,
  placeName: null,
  ...overrides,
});

describe("placeLabelOf", () => {
  test.each<[string, Partial<IbadahPlace>, string]>([
    [
      "gereja dengan ruang",
      { room: { name: "Gedung Gereja" } },
      "Gedung Gereja",
    ],
    ["gereja tanpa ruang", {}, "Gereja"],
    [
      "rumah jemaat",
      { placeType: "RUMAH_JEMAAT", hostKeluarga: { name: "Keluarga Halim" } },
      "Rumah Keluarga Halim",
    ],
    [
      "rumah jemaat tanpa relasi",
      { placeType: "RUMAH_JEMAAT" },
      "Rumah jemaat",
    ],
    [
      "lainnya",
      { placeType: "LAINNYA", placeName: "Villa Ciater" },
      "Villa Ciater",
    ],
    ["lainnya tanpa nama", { placeType: "LAINNYA" }, "Lainnya"],
    [
      "ruang lama diabaikan di luar gereja",
      {
        placeType: "LAINNYA",
        placeName: "Villa Ciater",
        room: { name: "Aula" },
      },
      "Villa Ciater",
    ],
  ])("%s", (_, overrides, expected) => {
    expect(placeLabelOf(place(overrides))).toBe(expected);
  });
});
