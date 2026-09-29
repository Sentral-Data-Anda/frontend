import { describe, expect, test } from "bun:test";

import {
  copyLinesOf,
  isRateStale,
  lineSubtotalText,
  newLine,
  orderFormSchema,
  orderTotalOf,
  overEstimateOf,
  overEstimateText,
  toIdr,
  toOrderPayload,
  toPriceInput,
  type OrderFormValues,
} from "./model";

const REQUEST = {
  code: "PRQ-2026-0004",
  purpose: "Peralatan sound ibadah raya",
  items: [
    {
      name: "Mixer digital 32 kanal",
      quantity: 1,
      estimatedUnitPrice: "15000000",
    },
    {
      name: "Mikrofon wireless",
      quantity: 2,
      estimatedUnitPrice: "3500000",
    },
  ],
};

const line = (quantity: string, unitPrice: string) => ({
  ...newLine("Keperluan"),
  name: "Barang",
  quantity,
  unitPrice,
  unitId: "1",
  typeId: "2",
  roomId: "3",
});

const values = (items: OrderFormValues["items"]): OrderFormValues => ({
  purchaseRequestId: "4",
  supplierId: "2",
  orderDate: "2026-09-20",
  currencyCode: "USD",
  items,
});

describe("salin barang dari permintaan", () => {
  test("IDR: harga = perkiraan, keterangan = keperluan, satuan/tipe/ruang kosong", () => {
    const [first, second] = copyLinesOf(REQUEST, "IDR");

    expect(first).toEqual({
      name: "Mixer digital 32 kanal",
      description: "Peralatan sound ibadah raya",
      quantity: "1",
      unitPrice: "15000000",
      unitId: "",
      typeId: "",
      roomId: "",
    });
    expect(second?.unitPrice).toBe("3500000");
  });

  test("valas: harga dikosongkan tanpa konversi", () => {
    expect(copyLinesOf(REQUEST, "USD").map((row) => row.unitPrice)).toEqual([
      "",
      "",
    ]);
  });
});

describe("desimal be-sada", () => {
  test("string terpendek maupun berekor nol dibaca sama", () => {
    expect(toPriceInput("520.5")).toBe("520.5");
    expect(toPriceInput("520.5000")).toBe("520.5");
    expect(toPriceInput("15800")).toBe("15800");
    expect(toPriceInput("0")).toBe("");
  });

  test("payload: angka number, desimal bertitik, orderDate", () => {
    const payload = toOrderPayload(values([line("2", "520.5")]));

    expect(payload.orderDate).toBe("2026-09-20");
    expect(payload.items[0]).toEqual({
      name: "Barang",
      description: "Keperluan",
      quantity: 2,
      unitPrice: 520.5,
      typeId: 2,
      roomId: 3,
      unitId: 1,
    });
    expect(JSON.stringify(payload)).toContain('"unitPrice":520.5');
  });
});

describe("total dan subtotal per mata uang", () => {
  test("baris kosong/nol tampil —, total menjumlah yang terisi", () => {
    expect(lineSubtotalText(line("2", ""), "USD")).toBe("—");
    expect(lineSubtotalText(line("2", "520.5"), "USD")).toBe("USD 1.041,00");
    expect(lineSubtotalText(line("3", "185000"), "IDR")).toBe("Rp 555.000");
    expect(
      orderTotalOf([line("2", "520.5"), line("", "9"), line("1", "0.25")]),
    ).toBe(1041.25);
  });

  test("Rupiah dibulatkan sekali", () => {
    expect(toIdr(1041.25, 15_800)).toBe(16_451_750);
    expect(toIdr(0.333, 3)).toBe(1);
  });
});

describe("kurs lama", () => {
  test("lebih dari 7 hari sebelum tanggal pesanan", () => {
    expect(isRateStale("2026-09-13T00:00:00.000Z", "2026-09-20")).toBe(false);
    expect(isRateStale("2026-09-12T00:00:00.000Z", "2026-09-20")).toBe(true);
  });
});

describe("melebihi perkiraan (Rupiah)", () => {
  test("total + pesanan lain > perkiraan", () => {
    const over = overEstimateOf({
      requestCode: "PRQ-2026-0005",
      totalIDR: 8_600_000,
      orderedTotalIDR: "0",
      totalEstimatedIDR: "8000000",
    });

    expect(over).not.toBeNull();
    expect(overEstimateText(over!)).toBe(
      "Total pesanan dari permintaan PRQ-2026-0005 menjadi Rp 8.600.000, melebihi perkiraan yang disetujui Rp 8.000.000 (+7,5%).",
    );
  });

  test("sama dengan perkiraan tidak memperingatkan", () => {
    expect(
      overEstimateOf({
        requestCode: "X",
        totalIDR: 5_000_000,
        orderedTotalIDR: "3000000",
        totalEstimatedIDR: "8000000",
      }),
    ).toBeNull();
  });
});

describe("skema", () => {
  test("baris kosong: galat per field items.<i>.<field>", () => {
    const result = orderFormSchema.safeParse(values([newLine()]));
    const paths = result.error?.issues.map((issue) => issue.path.join("."));

    expect(paths).toEqual([
      "items.0.name",
      "items.0.description",
      "items.0.quantity",
      "items.0.unitPrice",
      "items.0.unitId",
      "items.0.typeId",
      "items.0.roomId",
    ]);
  });

  test("tanpa barang dan tanggal masa depan ditolak", () => {
    const result = orderFormSchema.safeParse({
      ...values([]),
      orderDate: "2999-01-01",
    });
    const messages = result.error?.issues.map((issue) => issue.message);

    expect(messages).toContain("Tanggal pesanan tidak boleh di masa depan");
    expect(messages).toContain("Tambahkan minimal satu barang");
  });
});
