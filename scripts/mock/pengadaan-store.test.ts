import { afterAll, describe, expect, test } from "bun:test";

import {
  ASSET,
  STOCK_ITEM,
  STOCK_MOVEMENT,
  supplierDdl,
} from "./inventaris-store";
import {
  GOODS_RECEIPT,
  PURCHASE_ORDER,
  PURCHASE_REQUEST,
  PURCHASE_RETURN,
  TODAY,
  copyPurchaseRequest,
  CURRENCY,
  currencyDdl,
  currencyView,
  decimal,
  goodsReceiptView,
  decidePurchaseRequest,
  kursPreview,
  orderStatusOf,
  purchaseOrderDdl,
  purchaseOrderView,
  purchaseRequestDdl,
  purchaseRequestView,
  purchaseReturnView,
  cancelReturn,
  completeReturn,
  createReturn,
  deleteReturn,
  rateOn,
  receiveGoods,
  returnedTotalsOf,
  submitReturn,
  submitPurchaseRequest,
} from "./pengadaan-store";

const YEAR = TODAY.slice(0, 4);

const snapshot = <T extends object>(rows: T[]) => {
  const copy = rows.map((row) => structuredClone(row));

  return () => {
    rows.splice(copy.length);
    copy.forEach((row, index) => Object.assign(rows[index] as T, row));
  };
};

const restores = [
  PURCHASE_REQUEST,
  PURCHASE_ORDER,
  PURCHASE_RETURN,
  GOODS_RECEIPT,
  ASSET,
  STOCK_ITEM,
  STOCK_MOVEMENT,
].map((rows) => snapshot<object>(rows));

afterAll(() => {
  for (const restore of restores) restore();
});

const orderBy = (predicate: (code: string, currency: string) => boolean) => {
  const found = PURCHASE_ORDER.find((row) =>
    predicate(row.code, row.currencyCode),
  );
  if (!found) throw new Error("pesanan seed tidak ada");

  return found;
};

const requestBy = (purpose: string) => {
  const found = PURCHASE_REQUEST.find((row) => row.purpose === purpose);
  if (!found) throw new Error(`permintaan seed tidak ada: ${purpose}`);

  return found;
};

describe("seed", () => {
  test("status pesanan sama dengan hasil hitung penerimaan", () => {
    for (const row of PURCHASE_ORDER.filter(
      (item) => item.status !== "CANCELLED",
    )) {
      expect(row.status).toBe(orderStatusOf(row));
    }
  });

  test("penerimaan seed cocok dengan catatan mutasi Inventaris", () => {
    expect(GOODS_RECEIPT.map((row) => row.code)).toEqual([
      `GRN-${YEAR}-0001`,
      `GRN-${YEAR}-0002`,
      `GRN-${YEAR}-0003`,
    ]);
    expect(
      STOCK_MOVEMENT.filter(
        (row) => row.note === `Penerimaan GRN-${YEAR}-0001`,
      ),
    ).toHaveLength(2);
  });

  test("supplier ddl hanya yang aktif dan hidup, dengan telepon", () => {
    const names = supplierDdl().map((row) => row.name);

    expect(names).not.toContain("CV Lama Jaya");
    expect(names).not.toContain("Toko Serba Ada");
    expect(supplierDdl()[0]).toHaveProperty("phone");
  });
});

describe("kurs", () => {
  test("rupiah = 1; valas = kurs terakhir ≤ tanggal; tanpa kurs = null", () => {
    expect(rateOn("IDR", TODAY)?.rate).toBe(1);
    expect(rateOn("usd", TODAY)?.rate).toBe(15_800);
    expect(rateOn("EUR", TODAY)).toBeNull();
    expect(kursPreview("EUR", TODAY)).toBeNull();
    expect(kursPreview("SGD", TODAY)?.rate).toBe("12100");
  });

  test("ddl mata uang: dasar dulu", () => {
    expect(currencyDdl().map((row) => row.code)).toEqual([
      "IDR",
      "EUR",
      "SGD",
      "USD",
    ]);
  });
});

describe("format be-sada", () => {
  test("desimal terpendek tanpa nol di belakang", () => {
    expect(decimal(15_800, 6)).toBe("15800");
    expect(decimal(15_800.1234564, 6)).toBe("15800.123456");
    expect(decimal(300.55556, 4)).toBe("300.5556");
    expect(decimal(4_748_814.009)).toBe("4748814.01");
    expect(decimal(0)).toBe("0");
  });

  test("daftar vs detail pesanan; penerimaan menghitung baris pesanan", () => {
    const partial = PURCHASE_ORDER.find(
      (row) => row.status === "PARTIALLY_RECEIVED",
    );
    if (!partial) throw new Error("seed");
    const row = purchaseOrderView(partial);

    expect(row).not.toHaveProperty("receivedTotalIDR");
    expect(row.purchaseRequest).not.toHaveProperty("orderedTotalIDR");

    const first = GOODS_RECEIPT[0];
    if (!first) throw new Error("seed");

    expect(goodsReceiptView(first)).toMatchObject({
      id: first.id,
      itemCount: 2,
    });
  });

  test("kurs terbaru apa pun tanggalnya; pengaju persetujuan", () => {
    const usd = CURRENCY.find((row) => row.code === "USD");
    if (!usd) throw new Error("seed");

    expect(currencyView(usd).latestRate?.rate).toBe("15800");
    expect(
      purchaseRequestView(
        requestBy("Proyektor portabel untuk persekutuan pemuda"),
      ).approval?.isSubmittedByViewer,
    ).toBe(true);
    expect(
      purchaseRequestView(requestBy("Perlengkapan dapur persekutuan kaum ibu"))
        .approval?.isSubmittedByViewer,
    ).toBe(false);
  });
});

describe("tampilan pesanan", () => {
  test("pesanan USD: total Rupiah = total asing × kurs yang dibekukan", () => {
    const usd = orderBy((_, currency) => currency === "USD");
    const view = purchaseOrderView(usd, true);

    expect(view.totalForeignCurrency).toBe("1041");
    expect(view.exchangeRate).toBe("15750");
    expect(view.totalIDR).toBe("16395750");
    expect(view.rateDate).not.toBe(view.orderDate);
  });

  test("sudah dipesan tidak menghitung pesanan ini; sisa per baris", () => {
    const partial = PURCHASE_ORDER.find(
      (row) => row.status === "PARTIALLY_RECEIVED",
    );
    if (!partial) throw new Error("seed");
    const view = purchaseOrderView(partial, true);
    if (!("items" in view)) throw new Error("bukan detail");

    expect(view.purchaseRequest?.orderedTotalIDR).toBe("0");
    expect(view.items.map((item) => item.remainingQuantity)).toEqual([1, 20]);
    expect(view.receipts).toHaveLength(1);
  });

  test("permintaan dipesan melebihi perkiraan", () => {
    const view = purchaseRequestView(
      requestBy("Kertas, kidung, dan lilin untuk ibadah"),
      true,
    );
    if (!("orderedTotalIDR" in view)) throw new Error("bukan detail");

    expect(Number(view.orderedTotalIDR)).toBeGreaterThan(
      Number(view.totalEstimatedIDR),
    );
  });

  test("ddl: permintaan hanya yang disetujui; pesanan terbuka saja", () => {
    expect(
      purchaseRequestDdl({ filter: "", limit: null }).every((row) =>
        PURCHASE_REQUEST.some(
          (item) => item.code === row.code && item.status === "APPROVED",
        ),
      ),
    ).toBe(true);
    expect(
      purchaseOrderDdl({ filter: "", isOpen: true, supplierId: null }).map(
        (row) => row.status,
      ),
    ).not.toContain("RECEIVED");
  });
});

describe("persetujuan permintaan", () => {
  test("ajukan → tarik → Draf; ajukan lagi → tolak → baca saja", () => {
    const draft = requestBy("Alat musik ibadah pemuda");

    expect("row" in submitPurchaseRequest(draft)).toBe(true);
    expect(draft.status).toBe("PENDING_APPROVAL");

    decidePurchaseRequest(draft.code, "CANCELLED");
    expect(draft.status).toBe("DRAFT");

    submitPurchaseRequest(draft);
    expect(draft.approvals).toHaveLength(2);

    const approval = draft.approvals.at(-1);
    decidePurchaseRequest(approval?.publicId ?? "", "REJECTED", "Belum perlu");
    expect(draft.status).toBe("REJECTED");
    expect(purchaseRequestView(draft).approval?.note).toBe("Belum perlu");

    const again = submitPurchaseRequest(draft);
    expect("failure" in again && again.failure.message).toBe(
      "Permintaan Pembelian Ini Sudah Ditolak. Ajukan Ulang Sebagai Permintaan Baru",
    );
    expect(copyPurchaseRequest(draft.code)?.items).toHaveLength(3);

    const pending = requestBy("Perlengkapan dapur persekutuan kaum ibu");
    const twice = submitPurchaseRequest(pending);
    expect("failure" in twice && twice.failure.message).toBe(
      "Permintaan Pembelian Ini Sudah Diajukan",
    );
  });

  test("salin hanya untuk yang ditolak", () => {
    expect(
      copyPurchaseRequest(requestBy("Perlengkapan retret pemuda Oktober").code),
    ).toBeNull();
  });
});

describe("receiveGoods", () => {
  test("baris barang N → N barang, harga Rupiah memakai kurs pesanan", () => {
    const usd = orderBy((_, currency) => currency === "USD");
    const assetsBefore = ASSET.length;
    const result = receiveGoods({
      purchaseOrderId: usd.id,
      receivedDate: TODAY,
      note: null,
      attachments: [],
      items: [
        {
          purchaseOrderItemId: usd.items[0]?.id ?? 0,
          quantityReceived: 1,
          target: "ASSET",
          stockItemId: null,
        },
      ],
    });

    expect("receipt" in result).toBe(true);
    expect(ASSET).toHaveLength(assetsBefore + 1);
    expect(ASSET.at(-1)?.acquisitionCost).toBe(16_395_750);
    expect(usd.status).toBe("RECEIVED");
  });

  test("tolak: baris ganda, melebihi sisa, satuan beda — tanpa menulis", () => {
    const kursi = PURCHASE_ORDER.find(
      (row) => row.status === "ISSUED" && row.currencyCode === "IDR",
    );
    if (!kursi) throw new Error("seed");
    const line = kursi.items[0];
    const kertas = STOCK_ITEM.find((row) => row.name === "Kertas HVS A4");
    const receipts = GOODS_RECEIPT.length;
    const base = {
      purchaseOrderId: kursi.id,
      receivedDate: TODAY,
      note: null,
      attachments: [],
    };
    const receive = (items: Parameters<typeof receiveGoods>[0]["items"]) => {
      const result = receiveGoods({ ...base, items });

      return "failure" in result ? result.failure : null;
    };
    const one = {
      purchaseOrderItemId: line?.id ?? 0,
      quantityReceived: 10,
      target: "STOCK" as const,
      stockItemId: null,
    };

    expect(receive([one, one])?.path).toBe("items.1.purchaseOrderItemId");
    expect(receive([{ ...one, quantityReceived: 41 }])?.path).toBe(
      "items.0.quantityReceived",
    );
    expect(receive([{ ...one, stockItemId: kertas?.id ?? 0 }])?.message).toBe(
      "Satuan Barang Persediaan Berbeda Dengan Pesanan (Rim / Buah)",
    );
    expect(GOODS_RECEIPT).toHaveLength(receipts);
  });

  test("urutan cek: semua baris dulu (#4), baru barang persediaan (#5)", () => {
    const partial = PURCHASE_ORDER.find(
      (row) => row.status === "PARTIALLY_RECEIVED",
    );
    const lilin = STOCK_ITEM.find((row) => row.name === "Lilin Altar");
    if (!partial || !lilin) throw new Error("seed");
    const [proyektor, kertas] = partial.items;

    const result = receiveGoods({
      purchaseOrderId: partial.id,
      receivedDate: TODAY,
      note: null,
      attachments: [],
      items: [
        {
          purchaseOrderItemId: kertas?.id ?? 0,
          quantityReceived: 5,
          target: "STOCK",
          stockItemId: lilin.id,
        },
        {
          purchaseOrderItemId: proyektor?.id ?? 0,
          quantityReceived: 2,
          target: "ASSET",
          stockItemId: null,
        },
      ],
    });

    expect("failure" in result && result.failure.path).toBe(
      "items.1.quantityReceived",
    );
  });

  test("persediaan baru: mutasi masuk + harga beli terakhir", () => {
    const kursi = PURCHASE_ORDER.find(
      (row) => row.status === "ISSUED" && row.currencyCode === "IDR",
    );
    if (!kursi) throw new Error("seed");
    const result = receiveGoods({
      purchaseOrderId: kursi.id,
      receivedDate: TODAY,
      note: "Sebagian dulu",
      attachments: [],
      items: [
        {
          purchaseOrderItemId: kursi.items[0]?.id ?? 0,
          quantityReceived: 10,
          target: "STOCK",
          stockItemId: null,
        },
      ],
    });
    if (!("receipt" in result)) throw new Error(result.failure.message);

    const created = STOCK_ITEM.at(-1);

    expect(created?.quantity).toBe(10);
    expect(created?.lastUnitPrice).toBe(215_000);
    expect(STOCK_MOVEMENT.at(-1)?.note).toBe(
      `Penerimaan ${result.receipt.code}`,
    );
    expect(kursi.status).toBe("PARTIALLY_RECEIVED");
  });
});

describe("retur pembelian", () => {
  const receiptWith = (predicate: (stockItemId: number | null) => boolean) => {
    const found = GOODS_RECEIPT.find((row) =>
      row.items.some((item) => predicate(item.stockItemId)),
    );
    if (!found) throw new Error("penerimaan seed tidak ada");

    return found;
  };

  const onApprove = (row: (typeof PURCHASE_RETURN)[number]) => {
    submitReturn(row);
    row.approvedAt = new Date().toISOString();
  };

  test("nilai retur memakai harga baris dan kurs pesanannya", () => {
    const receipt = receiptWith((stockItemId) => stockItemId !== null);
    const line = receipt.items[0];
    const order = PURCHASE_ORDER.find(
      (row) => row.id === receipt.purchaseOrderId,
    );
    const orderLine = order?.items.find(
      (one) => one.id === line?.purchaseOrderItemId,
    );
    if (!line || !order || !orderLine) throw new Error("seed");

    const result = createReturn({
      goodsReceiptId: receipt.id,
      returnDate: TODAY,
      reason: "Dua rim bergelombang",
      items: [{ goodsReceiptItemId: line.id, quantity: 2, reason: null }],
    });

    expect("row" in result).toBe(true);
    if (!("row" in result)) return;

    expect(purchaseReturnView(result.row).totalIDR).toBe(
      decimal(
        Math.round(orderLine.unitPrice * 2 * order.exchangeRate * 100) / 100,
        2,
      ),
    );
    expect(result.row.status).toBe("DRAFT");
  });

  // Meretur sembilan lalu dua dari sepuluh adalah satu kelebihan, dan tidak
  // ada satu pun retur yang salah bila dilihat sendiri-sendiri.
  test("tolak: melebihi sisa setelah menghitung retur sebelumnya", () => {
    const receipt = receiptWith((stockItemId) => stockItemId !== null);
    const line = receipt.items[0];
    if (!line) throw new Error("seed");

    const sisa =
      line.quantityReceived - (returnedTotalsOf(receipt.id).get(line.id) ?? 0);
    const result = createReturn({
      goodsReceiptId: receipt.id,
      returnDate: TODAY,
      reason: "Melebihi sisa",
      items: [
        { goodsReceiptItemId: line.id, quantity: sisa + 1, reason: null },
      ],
    });

    expect("failure" in result).toBe(true);
    if ("failure" in result) {
      expect(result.failure.status).toBe(400);
      expect(result.failure.message).toContain("Melebihi Jumlah Yang Diterima");
    }
  });

  test("tolak: baris penerimaan yang sama dua kali dalam satu retur", () => {
    const receipt = receiptWith((stockItemId) => stockItemId !== null);
    const line = receipt.items[0];
    if (!line) throw new Error("seed");

    const result = createReturn({
      goodsReceiptId: receipt.id,
      returnDate: TODAY,
      reason: "Baris ganda",
      items: [
        { goodsReceiptItemId: line.id, quantity: 1, reason: null },
        { goodsReceiptItemId: line.id, quantity: 1, reason: null },
      ],
    });

    expect("failure" in result).toBe(true);
    if ("failure" in result) {
      expect(result.failure.message).toContain("Tidak Boleh Diretur Dua Kali");
    }
  });

  test("tolak: selesaikan sebelum disetujui", () => {
    const receipt = receiptWith((stockItemId) => stockItemId !== null);
    const line = receipt.items[0];
    if (!line) throw new Error("seed");

    const created = createReturn({
      goodsReceiptId: receipt.id,
      returnDate: TODAY,
      reason: "Belum disetujui",
      items: [{ goodsReceiptItemId: line.id, quantity: 1, reason: null }],
    });
    if (!("row" in created)) throw new Error("seed");

    expect(completeReturn(created.row)).toHaveProperty("failure");
    submitReturn(created.row);
    expect(completeReturn(created.row)).toHaveProperty("failure");
  });

  test("selesai: stok keluar lewat mutasi dengan sumber PURCHASE_RETURN", () => {
    const receipt = receiptWith((stockItemId) => stockItemId !== null);
    const line = receipt.items.find((item) => item.stockItemId !== null);
    if (!line?.stockItemId) throw new Error("seed");

    const stock = STOCK_ITEM.find((row) => row.id === line.stockItemId);
    if (!stock) throw new Error("seed");

    const before = stock.quantity;
    const movements = STOCK_MOVEMENT.length;
    const created = createReturn({
      goodsReceiptId: receipt.id,
      // Hari ini, bukan tanggal penerimaannya: mutasi tidak boleh mendahului
      // mutasi terakhir barang itu.
      returnDate: TODAY,
      reason: "Satu rim dipulangkan",
      items: [{ goodsReceiptItemId: line.id, quantity: 1, reason: null }],
    });
    if (!("row" in created)) throw new Error("seed");

    onApprove(created.row);
    const done = completeReturn(created.row);

    expect(done).toHaveProperty("row");
    expect(created.row.status).toBe("COMPLETED");
    expect(stock.quantity).toBe(before - 1);
    expect(STOCK_MOVEMENT).toHaveLength(movements + 1);
    expect(STOCK_MOVEMENT.at(-1)?.source).toBe("PURCHASE_RETURN");
    expect(STOCK_MOVEMENT.at(-1)?.type).toBe("OUT");
    expect(STOCK_MOVEMENT.at(-1)?.balanceAfter).toBe(before - 1);
  });

  // `DisposalMethod` tidak punya nilai untuk "dikembalikan", dan gereja tidak
  // pernah benar-benar memilikinya: asetnya dicabut, bukan dilepas.
  test("selesai: barang aset dicabut dari daftar, bukan dilepas", () => {
    const row = PURCHASE_RETURN.find(
      (one) =>
        one.status === "SUBMITTED" &&
        one.items.some((item) => {
          const line = GOODS_RECEIPT.flatMap((receipt) => receipt.items).find(
            (one) => one.id === item.goodsReceiptItemId,
          );

          return line?.assetId !== null && line?.assetId !== undefined;
        }),
    );
    if (!row) throw new Error("seed");

    const assetId = GOODS_RECEIPT.flatMap((receipt) => receipt.items).find(
      (line) => line.id === row.items[0]?.goodsReceiptItemId,
    )?.assetId;
    const asset = ASSET.find((one) => one.id === assetId);
    if (!asset) throw new Error("seed");

    row.approvedAt = new Date().toISOString();

    expect(completeReturn(row)).toHaveProperty("row");
    expect(row.status).toBe("COMPLETED");
    expect(asset.deletedAt).not.toBeNull();
  });

  test("tolak: batalkan yang sudah selesai, hapus yang bukan draf", () => {
    const done = PURCHASE_RETURN.find((row) => row.status === "COMPLETED");
    if (!done) throw new Error("seed");

    expect(cancelReturn(done)).toHaveProperty("failure");
    expect(deleteReturn(done)).toHaveProperty("failure");
  });

  test("batalkan draf menutup pengajuannya juga", () => {
    const receipt = receiptWith((stockItemId) => stockItemId !== null);
    const line = receipt.items[0];
    if (!line) throw new Error("seed");

    const created = createReturn({
      goodsReceiptId: receipt.id,
      returnDate: TODAY,
      reason: "Salah hitung",
      items: [{ goodsReceiptItemId: line.id, quantity: 1, reason: null }],
    });
    if (!("row" in created)) throw new Error("seed");

    submitReturn(created.row);
    cancelReturn(created.row);

    expect(created.row.status).toBe("CANCELLED");
    expect(created.row.approvals.at(-1)?.status).toBe("CANCELLED");
  });
});
