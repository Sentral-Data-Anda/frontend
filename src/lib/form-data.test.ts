import { describe, expect, test } from "bun:test";

import { toFormData } from "./form-data";

const file = (name: string) => new File(["x"], name, { type: "image/jpeg" });

describe("toFormData", () => {
  test("boolean menjadi 1/0, angka menjadi teks", () => {
    const body = toFormData({ isPublish: true, isPaid: false, capacity: 40 });

    expect(body.get("isPublish")).toBe("1");
    expect(body.get("isPaid")).toBe("0");
    expect(body.get("capacity")).toBe("40");
  });

  test("null, undefined, dan teks kosong tidak dikirim", () => {
    const body = toFormData({ roomId: null, location: undefined, urlForm: "" });

    expect([...body.keys()]).toEqual([]);
  });

  test("tanggal dikirim apa adanya", () => {
    expect(toFormData({ startDate: "2026-10-12" }).get("startDate")).toBe(
      "2026-10-12",
    );
  });

  test("showOnWebsite berurutan sesuai berkas image", () => {
    const body = toFormData({}, [
      { field: "image", file: file("a.jpg"), showOnWebsite: true },
      { field: "image", file: file("b.jpg"), showOnWebsite: false },
      { field: "image", file: file("c.jpg"), showOnWebsite: true },
    ]);

    expect(body.getAll("image").map((entry) => (entry as File).name)).toEqual([
      "a.jpg",
      "b.jpg",
      "c.jpg",
    ]);
    expect(body.getAll("showOnWebsite")).toEqual(["1", "0", "1"]);
  });

  test("berkas tanpa showOnWebsite tidak menambah bendera", () => {
    const body = toFormData({}, [{ field: "mainImage", file: file("m.jpg") }]);

    expect((body.get("mainImage") as File).name).toBe("m.jpg");
    expect(body.getAll("showOnWebsite")).toEqual([]);
  });
});
